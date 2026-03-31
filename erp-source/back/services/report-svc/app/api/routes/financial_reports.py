from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_tenant_id
from app.application.report_service import report_service
from app.domain.models import ReportResult

router = APIRouter()


@router.get("/profit-and-loss", response_model=ReportResult)
async def profit_and_loss(
    date_from: date = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: date = Query(..., description="End date (YYYY-MM-DD)"),
    tenant_id: str = Depends(get_tenant_id),
):
    """Generate a Profit & Loss statement for the given period."""
    return await report_service.profit_and_loss(tenant_id, date_from, date_to)


@router.get("/balance-sheet", response_model=ReportResult)
async def balance_sheet(
    as_of: date = Query(..., description="Balance sheet date (YYYY-MM-DD)"),
    tenant_id: str = Depends(get_tenant_id),
):
    """Generate a Balance Sheet as of a specific date."""
    return await report_service.balance_sheet(tenant_id, as_of)


@router.get("/trial-balance", response_model=ReportResult)
async def trial_balance(
    as_of: date = Query(..., description="Trial balance date (YYYY-MM-DD)"),
    tenant_id: str = Depends(get_tenant_id),
):
    """Generate a Trial Balance as of a specific date."""
    return await report_service.trial_balance(tenant_id, as_of)


@router.get("/cash-flow", response_model=ReportResult)
async def cash_flow(
    date_from: date = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: date = Query(..., description="End date (YYYY-MM-DD)"),
    tenant_id: str = Depends(get_tenant_id),
):
    """Generate a Cash Flow statement for the given period."""
    return await report_service.cash_flow(tenant_id, date_from, date_to)
