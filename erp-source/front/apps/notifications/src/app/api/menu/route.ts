import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "notifications",
    moduleName: "Notifications",
    items: [
      { label: "All Notifications", href: "/notifications", icon: "Bell" },
      { label: "Settings", href: "/notifications/settings", icon: "Settings" },
    ],
  });
}
