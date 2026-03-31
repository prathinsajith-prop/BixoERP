from __future__ import annotations

import logging
from typing import Any

from app.infrastructure.clickhouse_client import clickhouse_client

logger = logging.getLogger(__name__)


class ProjectionService:
    """
    Handle incoming Kafka events and project (upsert) data into ClickHouse tables.
    All projections are idempotent — ReplacingMergeTree deduplicates by event_id.
    """

    async def project_event(self, event_type: str, payload: dict[str, Any], tenant_id: str) -> None:
        handler = self._handlers.get(event_type)
        if handler:
            await handler(self, payload, tenant_id)
        else:
            logger.debug("No projection handler for event type: %s", event_type)

    # ── Handlers ────────────────────────────────────────────────────────

    async def _project_journal_entry(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO fact_journal_entries
               (event_id, tenant_id, journal_id, account_id, entry_date,
                debit_amount, credit_amount, currency, description, created_at)
            VALUES""",
            [
                {
                    "event_id": payload.get("event_id", payload.get("id", "")),
                    "tenant_id": tenant_id,
                    "journal_id": payload.get("journal_id", ""),
                    "account_id": payload.get("account_id", ""),
                    "entry_date": payload.get("entry_date", payload.get("date", "1970-01-01")),
                    "debit_amount": payload.get("debit_amount", 0),
                    "credit_amount": payload.get("credit_amount", 0),
                    "currency": payload.get("currency", "USD"),
                    "description": payload.get("description", ""),
                    "created_at": payload.get("created_at", payload.get("timestamp", "1970-01-01 00:00:00")),
                }
            ],
        )
        logger.info("Projected journal entry %s for tenant %s", payload.get("journal_id"), tenant_id)

    async def _project_invoice(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO fact_invoices
               (event_id, tenant_id, invoice_id, customer_id, vendor_id,
                invoice_type, total_amount, currency, status, invoice_date, due_date, created_at)
            VALUES""",
            [
                {
                    "event_id": payload.get("event_id", payload.get("id", "")),
                    "tenant_id": tenant_id,
                    "invoice_id": payload.get("invoice_id", ""),
                    "customer_id": payload.get("customer_id", ""),
                    "vendor_id": payload.get("vendor_id", ""),
                    "invoice_type": payload.get("invoice_type", "RECEIVABLE"),
                    "total_amount": payload.get("total_amount", 0),
                    "currency": payload.get("currency", "USD"),
                    "status": payload.get("status", "DRAFT"),
                    "invoice_date": payload.get("invoice_date", "1970-01-01"),
                    "due_date": payload.get("due_date", "1970-01-01"),
                    "created_at": payload.get("created_at", payload.get("timestamp", "1970-01-01 00:00:00")),
                }
            ],
        )
        logger.info("Projected invoice %s for tenant %s", payload.get("invoice_id"), tenant_id)

    async def _project_sales_order(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO fact_sales_orders
               (event_id, tenant_id, order_id, customer_id, total_amount, currency,
                status, order_date, created_at)
            VALUES""",
            [
                {
                    "event_id": payload.get("event_id", payload.get("id", "")),
                    "tenant_id": tenant_id,
                    "order_id": payload.get("order_id", ""),
                    "customer_id": payload.get("customer_id", ""),
                    "total_amount": payload.get("total_amount", 0),
                    "currency": payload.get("currency", "USD"),
                    "status": payload.get("status", "DRAFT"),
                    "order_date": payload.get("order_date", "1970-01-01"),
                    "created_at": payload.get("created_at", payload.get("timestamp", "1970-01-01 00:00:00")),
                }
            ],
        )
        logger.info("Projected sales order %s for tenant %s", payload.get("order_id"), tenant_id)

    async def _project_stock_movement(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO fact_stock_movements
               (event_id, tenant_id, movement_id, product_id, warehouse_id,
                movement_type, quantity, current_qty, reorder_level, movement_date, created_at)
            VALUES""",
            [
                {
                    "event_id": payload.get("event_id", payload.get("id", "")),
                    "tenant_id": tenant_id,
                    "movement_id": payload.get("movement_id", ""),
                    "product_id": payload.get("product_id", payload.get("item_id", "")),
                    "warehouse_id": payload.get("warehouse_id", ""),
                    "movement_type": payload.get("movement_type", payload.get("type", "")),
                    "quantity": payload.get("quantity", 0),
                    "current_qty": payload.get("current_qty", payload.get("quantity_on_hand", 0)),
                    "reorder_level": payload.get("reorder_level", 0),
                    "movement_date": payload.get("movement_date", payload.get("date", "1970-01-01")),
                    "created_at": payload.get("created_at", payload.get("timestamp", "1970-01-01 00:00:00")),
                }
            ],
        )
        logger.info("Projected stock movement %s for tenant %s", payload.get("movement_id"), tenant_id)

    async def _project_payroll(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO fact_payroll
               (event_id, tenant_id, payroll_id, employee_id, gross_amount,
                net_amount, currency, pay_period_start, pay_period_end, created_at)
            VALUES""",
            [
                {
                    "event_id": payload.get("event_id", payload.get("id", "")),
                    "tenant_id": tenant_id,
                    "payroll_id": payload.get("payroll_id", ""),
                    "employee_id": payload.get("employee_id", ""),
                    "gross_amount": payload.get("gross_amount", 0),
                    "net_amount": payload.get("net_amount", 0),
                    "currency": payload.get("currency", "USD"),
                    "pay_period_start": payload.get("pay_period_start", "1970-01-01"),
                    "pay_period_end": payload.get("pay_period_end", "1970-01-01"),
                    "created_at": payload.get("created_at", payload.get("timestamp", "1970-01-01 00:00:00")),
                }
            ],
        )
        logger.info("Projected payroll %s for tenant %s", payload.get("payroll_id"), tenant_id)

    async def _project_work_order(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO fact_work_orders
               (event_id, tenant_id, work_order_id, product_id, quantity,
                status, planned_start, planned_end, actual_start, actual_end,
                total_cost, currency, created_at)
            VALUES""",
            [
                {
                    "event_id": payload.get("event_id", payload.get("id", "")),
                    "tenant_id": tenant_id,
                    "work_order_id": payload.get("work_order_id", ""),
                    "product_id": payload.get("product_id", ""),
                    "quantity": payload.get("quantity", 0),
                    "status": payload.get("status", "PLANNED"),
                    "planned_start": payload.get("planned_start", "1970-01-01"),
                    "planned_end": payload.get("planned_end", "1970-01-01"),
                    "actual_start": payload.get("actual_start", None),
                    "actual_end": payload.get("actual_end", None),
                    "total_cost": payload.get("total_cost", 0),
                    "currency": payload.get("currency", "USD"),
                    "created_at": payload.get("created_at", payload.get("timestamp", "1970-01-01 00:00:00")),
                }
            ],
        )
        logger.info("Projected work order %s for tenant %s", payload.get("work_order_id"), tenant_id)

    async def _project_account_dim(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO dim_accounts
               (tenant_id, account_id, account_code, account_name, category, is_active)
            VALUES""",
            [
                {
                    "tenant_id": tenant_id,
                    "account_id": payload.get("account_id", payload.get("id", "")),
                    "account_code": payload.get("account_code", payload.get("code", "")),
                    "account_name": payload.get("account_name", payload.get("name", "")),
                    "category": payload.get("category", ""),
                    "is_active": payload.get("is_active", True),
                }
            ],
        )

    async def _project_customer_dim(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO dim_customers
               (tenant_id, customer_id, customer_name, email, country)
            VALUES""",
            [
                {
                    "tenant_id": tenant_id,
                    "customer_id": payload.get("customer_id", payload.get("id", "")),
                    "customer_name": payload.get("customer_name", payload.get("name", "")),
                    "email": payload.get("email", ""),
                    "country": payload.get("country", ""),
                }
            ],
        )

    async def _project_vendor_dim(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO dim_vendors
               (tenant_id, vendor_id, vendor_name, email, country)
            VALUES""",
            [
                {
                    "tenant_id": tenant_id,
                    "vendor_id": payload.get("vendor_id", payload.get("id", "")),
                    "vendor_name": payload.get("vendor_name", payload.get("name", "")),
                    "email": payload.get("email", ""),
                    "country": payload.get("country", ""),
                }
            ],
        )

    async def _project_employee_dim(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO dim_employees
               (tenant_id, employee_id, full_name, department, position, hire_date)
            VALUES""",
            [
                {
                    "tenant_id": tenant_id,
                    "employee_id": payload.get("employee_id", payload.get("id", "")),
                    "full_name": payload.get("full_name", payload.get("name", "")),
                    "department": payload.get("department", ""),
                    "position": payload.get("position", ""),
                    "hire_date": payload.get("hire_date", "1970-01-01"),
                }
            ],
        )

    async def _project_product_dim(self, payload: dict[str, Any], tenant_id: str) -> None:
        clickhouse_client.execute(
            """INSERT INTO dim_products
               (tenant_id, product_id, sku, product_name, category, unit_price, currency)
            VALUES""",
            [
                {
                    "tenant_id": tenant_id,
                    "product_id": payload.get("product_id", payload.get("id", "")),
                    "sku": payload.get("sku", ""),
                    "product_name": payload.get("product_name", payload.get("name", "")),
                    "category": payload.get("category", ""),
                    "unit_price": payload.get("unit_price", 0),
                    "currency": payload.get("currency", "USD"),
                }
            ],
        )

    # ── Event → Handler mapping ─────────────────────────────────────────

    _handlers: dict[str, Any] = {
        # Finance / Journal
        "finance.journal.posted": _project_journal_entry,
        "finance.journal.created": _project_journal_entry,
        # Invoices
        "finance.invoice.created": _project_invoice,
        "finance.invoice.paid": _project_invoice,
        "finance.invoice.cancelled": _project_invoice,
        "apar.vendor-invoice.created": _project_invoice,
        "apar.vendor-invoice.approved": _project_invoice,
        # Sales
        "sales.order.created": _project_sales_order,
        "sales.order.confirmed": _project_sales_order,
        "sales.order.shipped": _project_sales_order,
        "sales.order.cancelled": _project_sales_order,
        # Inventory
        "inventory.stock.received": _project_stock_movement,
        "inventory.stock.issued": _project_stock_movement,
        "inventory.stock.transferred": _project_stock_movement,
        "inventory.stock.adjusted": _project_stock_movement,
        # Payroll
        "hr.payroll.processed": _project_payroll,
        # Manufacturing
        "manufacturing.order.created": _project_work_order,
        "manufacturing.order.completed": _project_work_order,
        # Dimension updates
        "finance.account.created": _project_account_dim,
        "finance.account.updated": _project_account_dim,
        "sales.customer.created": _project_customer_dim,
        "sales.customer.updated": _project_customer_dim,
        "procurement.vendor.created": _project_vendor_dim,
        "procurement.vendor.updated": _project_vendor_dim,
        "hr.employee.created": _project_employee_dim,
        "hr.employee.updated": _project_employee_dim,
        "inventory.product.created": _project_product_dim,
        "inventory.product.updated": _project_product_dim,
    }


projection_service = ProjectionService()
