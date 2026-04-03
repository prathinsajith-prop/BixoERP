import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "reports",
    moduleName: "Reports",
    items: [
      { label: "Dashboard", href: "/reports", icon: "BarChart3" },
      { label: "Financial Reports", href: "/reports/financial", icon: "Banknote" },
      { label: "Inventory Reports", href: "/reports/inventory", icon: "Package" },
      { label: "Sales Reports", href: "/reports/sales", icon: "TrendingUp" },
      { label: "HR Reports", href: "/reports/hr", icon: "Users" },
    ],
  });
}
