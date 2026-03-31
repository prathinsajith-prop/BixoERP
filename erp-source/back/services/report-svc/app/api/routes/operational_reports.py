from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_tenant_id
from app.infrastructure.clickhouse_client import clickhouse_client

router = APIRouter()


@router.get("/sales-analytics")
async def sales_analytics(
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("MONTHLY", regex="^(DAILY|WEEKLY|MONTHLY|YEARLY)$"),
    tenant_id: str = Depends(get_tenant_id),
) -> dict[str, Any]:
    """Sales analytics — revenue, order count, average order value over time."""
    trunc_fn = {
        "DAILY": "toStartOfDay",
        "WEEKLY": "toStartOfWeek",
        "MONTHLY": "toStartOfMonth",
        "YEARLY": "toStartOfYear",
    }[group_by]

    query = f"""
        SELECT
            {trunc_fn}(order_date) AS period,
            count()                AS order_count,
            sum(total_amount)      AS total_revenue,
            avg(total_amount)      AS avg_order_value
        FROM fact_sales_orders
        WHERE tenant_id = %(tenant_id)s
          AND toDate(order_date) >= %(date_from)s
          AND toDate(order_date) <= %(date_to)s
          AND status NOT IN ('CANCELLED')
        GROUP BY period
        ORDER BY period
    """
    rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "date_from": date_from, "date_to": date_to})

    return {
        "report": "sales_analytics",
        "date_from": str(date_from),
        "date_to": str(date_to),
        "group_by": group_by,
        "data": [
            {
                "period": str(r["period"]),
                "order_count": r["order_count"],
                "total_revenue": float(r["total_revenue"]),
                "avg_order_value": round(float(r["avg_order_value"]), 2),
            }
            for r in rows
        ],
    }


@router.get("/inventory-turnover")
async def inventory_turnover(
    date_from: date = Query(...),
    date_to: date = Query(...),
    tenant_id: str = Depends(get_tenant_id),
) -> dict[str, Any]:
    """Inventory turnover — issue vs receive quantities per product."""
    query = """
        SELECT
            dp.sku,
            dp.product_name,
            sumIf(sm.quantity, sm.movement_type = 'ISSUE')   AS total_issued,
            sumIf(sm.quantity, sm.movement_type = 'RECEIVE') AS total_received,
            if(total_received > 0, total_issued / total_received, 0) AS turnover_ratio
        FROM fact_stock_movements sm
        INNER JOIN dim_products dp ON sm.product_id = dp.product_id AND sm.tenant_id = dp.tenant_id
        WHERE sm.tenant_id = %(tenant_id)s
          AND sm.movement_date >= %(date_from)s
          AND sm.movement_date <= %(date_to)s
        GROUP BY dp.sku, dp.product_name
        ORDER BY turnover_ratio DESC
    """
    rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "date_from": date_from, "date_to": date_to})

    return {
        "report": "inventory_turnover",
        "date_from": str(date_from),
        "date_to": str(date_to),
        "data": [
            {
                "sku": r["sku"],
                "product_name": r["product_name"],
                "total_issued": float(r["total_issued"]),
                "total_received": float(r["total_received"]),
                "turnover_ratio": round(float(r["turnover_ratio"]), 2),
            }
            for r in rows
        ],
    }


@router.get("/procurement-spend")
async def procurement_spend(
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("MONTHLY", regex="^(DAILY|WEEKLY|MONTHLY|YEARLY)$"),
    tenant_id: str = Depends(get_tenant_id),
) -> dict[str, Any]:
    """Procurement spend — vendor invoices aggregated over time."""
    trunc_fn = {
        "DAILY": "toStartOfDay",
        "WEEKLY": "toStartOfWeek",
        "MONTHLY": "toStartOfMonth",
        "YEARLY": "toStartOfYear",
    }[group_by]

    query = f"""
        SELECT
            {trunc_fn}(invoice_date) AS period,
            dv.vendor_name,
            count()            AS invoice_count,
            sum(total_amount)  AS total_spend
        FROM fact_invoices fi
        INNER JOIN dim_vendors dv ON fi.vendor_id = dv.vendor_id AND fi.tenant_id = dv.tenant_id
        WHERE fi.tenant_id = %(tenant_id)s
          AND fi.invoice_type = 'PAYABLE'
          AND fi.invoice_date >= %(date_from)s
          AND fi.invoice_date <= %(date_to)s
        GROUP BY period, dv.vendor_name
        ORDER BY period, total_spend DESC
    """
    rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "date_from": date_from, "date_to": date_to})

    return {
        "report": "procurement_spend",
        "date_from": str(date_from),
        "date_to": str(date_to),
        "group_by": group_by,
        "data": [
            {
                "period": str(r["period"]),
                "vendor_name": r["vendor_name"],
                "invoice_count": r["invoice_count"],
                "total_spend": float(r["total_spend"]),
            }
            for r in rows
        ],
    }
