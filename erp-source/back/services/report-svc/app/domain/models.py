from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.domain.enums import ReportType, PeriodType


class TimeSeriesDataPoint(BaseModel):
    period: str
    value: Decimal
    label: str | None = None


class ReportDefinition(BaseModel):
    id: str | None = None
    tenant_id: str
    name: str
    report_type: ReportType
    period_type: PeriodType
    date_from: date
    date_to: date
    filters: dict[str, Any] = Field(default_factory=dict)
    columns: list[str] = Field(default_factory=list)
    created_at: datetime | None = None


class DashboardWidget(BaseModel):
    widget_id: str
    title: str
    metric_key: str
    current_value: Decimal
    previous_value: Decimal | None = None
    change_pct: Decimal | None = None
    sparkline: list[TimeSeriesDataPoint] = Field(default_factory=list)


class ReportRow(BaseModel):
    account_code: str | None = None
    account_name: str | None = None
    category: str | None = None
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    balance: Decimal = Decimal("0")


class ReportResult(BaseModel):
    title: str
    period_from: date
    period_to: date
    rows: list[ReportRow]
    totals: dict[str, Decimal] = Field(default_factory=dict)
    generated_at: datetime
