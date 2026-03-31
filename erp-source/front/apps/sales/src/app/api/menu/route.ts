import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "sales",
    moduleName: "Sales",
    items: [
      { label: "Dashboard", href: "/sales", icon: "LayoutDashboard" },
      { label: "Orders", href: "/sales/orders", icon: "ShoppingBag" },
      { label: "Customers", href: "/sales/customers", icon: "Users" },
      { label: "Quotes", href: "/sales/quotes", icon: "FileText" },
    ],
  });
}
