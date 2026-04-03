import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "integrations",
    moduleName: "Integrations",
    items: [
      { label: "Webhooks", href: "/integrations", icon: "PlugZap" },
      { label: "API Keys", href: "/integrations/api-keys", icon: "Key" },
      { label: "Connections", href: "/integrations/connections", icon: "Link" },
    ],
  });
}
