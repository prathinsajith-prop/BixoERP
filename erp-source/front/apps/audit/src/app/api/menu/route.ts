import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "audit",
    moduleName: "Audit",
    items: [
      { label: "Audit Log", href: "/audit", icon: "Shield" },
      { label: "Activity", href: "/audit/activity", icon: "Activity" },
    ],
  });
}
