import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "apar",
    moduleName: "AP / AR",
    items: [
      { label: "Dashboard", href: "/apar", icon: "LayoutDashboard" },
      { label: "Invoices", href: "/apar/invoices", icon: "FileText" },
      { label: "Payments", href: "/apar/payments", icon: "CreditCard" },
      { label: "Aging Report", href: "/apar/aging", icon: "Clock" },
      { label: "Credit Notes", href: "/apar/credit-notes", icon: "FileX" },
    ],
  });
}
