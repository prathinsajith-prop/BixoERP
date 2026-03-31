import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "inventory",
    moduleName: "Inventory",
    items: [
      { label: "Dashboard", href: "/inventory", icon: "LayoutDashboard" },
      { label: "Items", href: "/inventory/items", icon: "Package" },
      { label: "Warehouses", href: "/inventory/warehouses", icon: "Warehouse" },
      { label: "Stock Levels", href: "/inventory/stock", icon: "BarChart3" },
      { label: "Movements", href: "/inventory/movements", icon: "ArrowRightLeft" },
    ],
  });
}
