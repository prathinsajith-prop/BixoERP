from __future__ import annotations

import logging
from datetime import datetime
from decimal import Decimal

from app.domain.models import DashboardWidget, TimeSeriesDataPoint
from app.infrastructure.clickhouse_client import clickhouse_client
from app.infrastructure.redis_cache import redis_cache

logger = logging.getLogger(__name__)

CACHE_TTL = 30  # seconds — dashboards tolerate slight staleness


class DashboardService:
    """Real-time dashboard queries against ClickHouse with Redis caching."""

    async def orders_per_minute(self, tenant_id: str) -> DashboardWidget:
        cache_key = f"report:dashboard:{tenant_id}:orders_per_min"
        cached = await redis_cache.get(cache_key)
        if cached is not None:
            return DashboardWidget.model_validate_json(cached)

        query = """
            SELECT
                toStartOfMinute(order_date) AS minute,
                count() AS cnt
            FROM fact_sales_orders
            WHERE tenant_id = %(tenant_id)s
              AND order_date >= now() - INTERVAL 1 HOUR
            GROUP BY minute
            ORDER BY minute
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id})

        sparkline = [
            TimeSeriesDataPoint(period=str(r["minute"]), value=Decimal(str(r["cnt"])))
            for r in rows
        ]
        current = sparkline[-1].value if sparkline else Decimal("0")
        previous = sparkline[-2].value if len(sparkline) >= 2 else None
        change = (
            ((current - previous) / previous * 100) if previous and previous != 0 else None
        )

        widget = DashboardWidget(
            widget_id="orders_per_minute",
            title="Orders / Minute",
            metric_key="orders_per_min",
            current_value=current,
            previous_value=previous,
            change_pct=change,
            sparkline=sparkline[-30:],
        )
        await redis_cache.set(cache_key, widget.model_dump_json(), ttl=CACHE_TTL)
        return widget

    async def revenue_today(self, tenant_id: str) -> DashboardWidget:
        cache_key = f"report:dashboard:{tenant_id}:revenue_today"
        cached = await redis_cache.get(cache_key)
        if cached is not None:
            return DashboardWidget.model_validate_json(cached)

        query = """
            SELECT
                toStartOfHour(order_date) AS hour,
                sum(total_amount) AS revenue
            FROM fact_sales_orders
            WHERE tenant_id = %(tenant_id)s
              AND toDate(order_date) = today()
            GROUP BY hour
            ORDER BY hour
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id})

        sparkline = [
            TimeSeriesDataPoint(period=str(r["hour"]), value=Decimal(str(r["revenue"])))
            for r in rows
        ]
        total = sum(dp.value for dp in sparkline)

        widget = DashboardWidget(
            widget_id="revenue_today",
            title="Revenue Today",
            metric_key="revenue_today",
            current_value=total,
            sparkline=sparkline,
        )
        await redis_cache.set(cache_key, widget.model_dump_json(), ttl=CACHE_TTL)
        return widget

    async def stock_levels(self, tenant_id: str) -> DashboardWidget:
        cache_key = f"report:dashboard:{tenant_id}:stock_levels"
        cached = await redis_cache.get(cache_key)
        if cached is not None:
            return DashboardWidget.model_validate_json(cached)

        query = """
            SELECT count() AS total_items,
                   sum(if(current_qty <= reorder_level, 1, 0)) AS below_reorder
            FROM fact_stock_movements
            WHERE tenant_id = %(tenant_id)s
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id})
        r = rows[0] if rows else {"total_items": 0, "below_reorder": 0}

        widget = DashboardWidget(
            widget_id="stock_levels",
            title="Items Below Reorder",
            metric_key="stock_below_reorder",
            current_value=Decimal(str(r["below_reorder"])),
        )
        await redis_cache.set(cache_key, widget.model_dump_json(), ttl=CACHE_TTL)
        return widget

    async def get_all_widgets(self, tenant_id: str) -> list[DashboardWidget]:
        return [
            await self.orders_per_minute(tenant_id),
            await self.revenue_today(tenant_id),
            await self.stock_levels(tenant_id),
        ]


dashboard_service = DashboardService()
