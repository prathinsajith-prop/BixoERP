// ─── Reports ─────────────────────────────────

export interface DashboardWidget {
  id: string;
  type: "kpi" | "chart" | "table" | "list";
  title: string;
  config: Record<string, unknown>;
}

export interface KPIMetric {
  label: string;
  value: number;
  previousValue: number;
  changePercentage: number;
  trend: "up" | "down" | "flat";
  format: "currency" | "number" | "percentage";
}
