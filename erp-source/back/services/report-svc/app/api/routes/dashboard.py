from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_tenant_id
from app.application.dashboard_service import dashboard_service
from app.domain.models import DashboardWidget

router = APIRouter()


@router.get("", response_model=list[DashboardWidget])
async def get_dashboard(tenant_id: str = Depends(get_tenant_id)):
    """Get all real-time dashboard widgets."""
    return await dashboard_service.get_all_widgets(tenant_id)


@router.get("/orders-per-minute", response_model=DashboardWidget)
async def orders_per_minute(tenant_id: str = Depends(get_tenant_id)):
    """Orders per minute over the last hour."""
    return await dashboard_service.orders_per_minute(tenant_id)


@router.get("/revenue-today", response_model=DashboardWidget)
async def revenue_today(tenant_id: str = Depends(get_tenant_id)):
    """Cumulative revenue for today, broken down by hour."""
    return await dashboard_service.revenue_today(tenant_id)


@router.get("/stock-levels", response_model=DashboardWidget)
async def stock_levels(tenant_id: str = Depends(get_tenant_id)):
    """Number of items below reorder level."""
    return await dashboard_service.stock_levels(tenant_id)
