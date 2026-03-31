import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "manufacturing",
    moduleName: "Manufacturing",
    items: [
      { label: "Dashboard", href: "/manufacturing", icon: "LayoutDashboard" },
      { label: "Bills of Materials", href: "/manufacturing/bom", icon: "Layers" },
      { label: "Work Orders", href: "/manufacturing/work-orders", icon: "ClipboardList" },
      { label: "Production", href: "/manufacturing/production", icon: "Factory" },
    ],
  });
}
