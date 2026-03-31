from __future__ import annotations

import csv
import io
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_tenant_id
from app.application.report_service import report_service
from app.domain.enums import FinancialReportKind

router = APIRouter()


@router.get("/csv")
async def export_csv(
    report: FinancialReportKind = Query(..., description="Report kind to export"),
    date_from: date = Query(...),
    date_to: date = Query(...),
    tenant_id: str = Depends(get_tenant_id),
):
    """Export a financial report as CSV."""
    result = await _generate_report(report, tenant_id, date_from, date_to)

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["Account Code", "Account Name", "Category", "Debit", "Credit", "Balance"])

    for row in result.rows:
        writer.writerow([
            row.account_code or "",
            row.account_name or "",
            row.category or "",
            str(row.debit),
            str(row.credit),
            str(row.balance),
        ])

    # Totals
    writer.writerow([])
    for key, value in result.totals.items():
        writer.writerow(["", "", key, "", "", str(value)])

    output.seek(0)
    filename = f"{report.value.lower()}_{date_from}_{date_to}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _generate_report(
    kind: FinancialReportKind,
    tenant_id: str,
    date_from: date,
    date_to: date,
) -> Any:
    match kind:
        case FinancialReportKind.PROFIT_AND_LOSS:
            return await report_service.profit_and_loss(tenant_id, date_from, date_to)
        case FinancialReportKind.BALANCE_SHEET:
            return await report_service.balance_sheet(tenant_id, date_to)
        case FinancialReportKind.TRIAL_BALANCE:
            return await report_service.trial_balance(tenant_id, date_to)
        case FinancialReportKind.CASH_FLOW:
            return await report_service.cash_flow(tenant_id, date_from, date_to)
