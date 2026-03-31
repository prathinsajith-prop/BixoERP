from __future__ import annotations

import logging
from datetime import date, datetime
from decimal import Decimal

from app.domain.models import ReportResult, ReportRow
from app.infrastructure.clickhouse_client import clickhouse_client

logger = logging.getLogger(__name__)


class ReportService:
    """Generate financial reports from ClickHouse fact/dimension tables."""

    async def profit_and_loss(self, tenant_id: str, date_from: date, date_to: date) -> ReportResult:
        query = """
            SELECT
                da.account_code,
                da.account_name,
                da.category,
                sum(je.debit_amount)  AS total_debit,
                sum(je.credit_amount) AS total_credit,
                sum(je.credit_amount) - sum(je.debit_amount) AS balance
            FROM fact_journal_entries je
            INNER JOIN dim_accounts da ON je.account_id = da.account_id AND je.tenant_id = da.tenant_id
            WHERE je.tenant_id = %(tenant_id)s
              AND je.entry_date >= %(date_from)s
              AND je.entry_date <= %(date_to)s
              AND da.category IN ('REVENUE', 'EXPENSE')
            GROUP BY da.account_code, da.account_name, da.category
            ORDER BY da.category, da.account_code
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "date_from": date_from, "date_to": date_to})

        report_rows: list[ReportRow] = []
        total_revenue = Decimal("0")
        total_expense = Decimal("0")

        for r in rows:
            row = ReportRow(
                account_code=r["account_code"],
                account_name=r["account_name"],
                category=r["category"],
                debit=Decimal(str(r["total_debit"])),
                credit=Decimal(str(r["total_credit"])),
                balance=Decimal(str(r["balance"])),
            )
            report_rows.append(row)
            if r["category"] == "REVENUE":
                total_revenue += row.balance
            else:
                total_expense += abs(row.balance)

        return ReportResult(
            title="Profit & Loss Statement",
            period_from=date_from,
            period_to=date_to,
            rows=report_rows,
            totals={
                "total_revenue": total_revenue,
                "total_expense": total_expense,
                "net_income": total_revenue - total_expense,
            },
            generated_at=datetime.utcnow(),
        )

    async def balance_sheet(self, tenant_id: str, as_of: date) -> ReportResult:
        query = """
            SELECT
                da.account_code,
                da.account_name,
                da.category,
                sum(je.debit_amount) - sum(je.credit_amount) AS balance
            FROM fact_journal_entries je
            INNER JOIN dim_accounts da ON je.account_id = da.account_id AND je.tenant_id = da.tenant_id
            WHERE je.tenant_id = %(tenant_id)s
              AND je.entry_date <= %(as_of)s
              AND da.category IN ('ASSET', 'LIABILITY', 'EQUITY')
            GROUP BY da.account_code, da.account_name, da.category
            ORDER BY da.category, da.account_code
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "as_of": as_of})

        report_rows: list[ReportRow] = []
        totals: dict[str, Decimal] = {"ASSET": Decimal("0"), "LIABILITY": Decimal("0"), "EQUITY": Decimal("0")}

        for r in rows:
            balance = Decimal(str(r["balance"]))
            category = r["category"]
            # Liabilities and equity are credit-normal, so flip sign
            if category in ("LIABILITY", "EQUITY"):
                balance = -balance
            report_rows.append(
                ReportRow(
                    account_code=r["account_code"],
                    account_name=r["account_name"],
                    category=category,
                    balance=balance,
                )
            )
            totals[category] += balance

        return ReportResult(
            title="Balance Sheet",
            period_from=as_of,
            period_to=as_of,
            rows=report_rows,
            totals={
                "total_assets": totals["ASSET"],
                "total_liabilities": totals["LIABILITY"],
                "total_equity": totals["EQUITY"],
            },
            generated_at=datetime.utcnow(),
        )

    async def trial_balance(self, tenant_id: str, as_of: date) -> ReportResult:
        query = """
            SELECT
                da.account_code,
                da.account_name,
                da.category,
                sum(je.debit_amount)  AS total_debit,
                sum(je.credit_amount) AS total_credit
            FROM fact_journal_entries je
            INNER JOIN dim_accounts da ON je.account_id = da.account_id AND je.tenant_id = da.tenant_id
            WHERE je.tenant_id = %(tenant_id)s
              AND je.entry_date <= %(as_of)s
            GROUP BY da.account_code, da.account_name, da.category
            ORDER BY da.account_code
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "as_of": as_of})

        report_rows: list[ReportRow] = []
        sum_debit = Decimal("0")
        sum_credit = Decimal("0")

        for r in rows:
            d = Decimal(str(r["total_debit"]))
            c = Decimal(str(r["total_credit"]))
            report_rows.append(
                ReportRow(
                    account_code=r["account_code"],
                    account_name=r["account_name"],
                    category=r["category"],
                    debit=d,
                    credit=c,
                    balance=d - c,
                )
            )
            sum_debit += d
            sum_credit += c

        return ReportResult(
            title="Trial Balance",
            period_from=as_of,
            period_to=as_of,
            rows=report_rows,
            totals={"total_debit": sum_debit, "total_credit": sum_credit},
            generated_at=datetime.utcnow(),
        )

    async def cash_flow(self, tenant_id: str, date_from: date, date_to: date) -> ReportResult:
        query = """
            SELECT
                da.category AS flow_category,
                da.account_name,
                sum(je.debit_amount) - sum(je.credit_amount) AS net_flow
            FROM fact_journal_entries je
            INNER JOIN dim_accounts da ON je.account_id = da.account_id AND je.tenant_id = da.tenant_id
            WHERE je.tenant_id = %(tenant_id)s
              AND je.entry_date >= %(date_from)s
              AND je.entry_date <= %(date_to)s
              AND da.category IN ('ASSET')
              AND da.account_code LIKE '1%%'
            GROUP BY da.category, da.account_name
            ORDER BY da.account_name
        """
        rows = clickhouse_client.query(query, {"tenant_id": tenant_id, "date_from": date_from, "date_to": date_to})

        report_rows: list[ReportRow] = []
        total_flow = Decimal("0")

        for r in rows:
            flow = Decimal(str(r["net_flow"]))
            report_rows.append(
                ReportRow(account_name=r["account_name"], category=r["flow_category"], balance=flow)
            )
            total_flow += flow

        return ReportResult(
            title="Cash Flow Statement",
            period_from=date_from,
            period_to=date_to,
            rows=report_rows,
            totals={"net_cash_flow": total_flow},
            generated_at=datetime.utcnow(),
        )


report_service = ReportService()
