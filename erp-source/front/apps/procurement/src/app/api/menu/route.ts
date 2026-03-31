import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "procurement",
    moduleName: "Procurement",
    items: [
      { label: "Dashboard", href: "/procurement", icon: "LayoutDashboard" },
      { label: "Purchase Orders", href: "/procurement/orders", icon: "ClipboardList" },
      { label: "Vendors", href: "/procurement/vendors", icon: "Truck" },
      { label: "Receiving", href: "/procurement/receiving", icon: "PackageCheck" },
    ],
  });
}
