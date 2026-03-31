import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "finance",
    moduleName: "Finance",
    items: [
      { label: "Dashboard", href: "/finance", icon: "LayoutDashboard" },
      { label: "Chart of Accounts", href: "/finance/accounts", icon: "List" },
      { label: "Journal Entries", href: "/finance/journals", icon: "BookOpen" },
      { label: "Fiscal Periods", href: "/finance/periods", icon: "Calendar" },
      { label: "Budgets", href: "/finance/budgets", icon: "PiggyBank" },
      { label: "Tax Management", href: "/finance/tax", icon: "Receipt" },
    ],
  });
}
