import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "workflow",
    moduleName: "Workflow",
    items: [
      { label: "Pending Approvals", href: "/workflow", icon: "Clock" },
      { label: "My Requests", href: "/workflow/my-requests", icon: "Send" },
      { label: "Workflow Rules", href: "/workflow/rules", icon: "Settings" },
    ],
  });
}
