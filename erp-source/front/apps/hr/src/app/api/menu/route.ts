import { NextResponse } from "next/server";
import manifest from "../../../../manifest.json";

export async function GET() {
  return NextResponse.json({
    moduleId: manifest.module.id,
    moduleName: manifest.module.name,
    items: manifest.ui.menu.map(({ label, href, icon, permission, visibleTo, position }) => ({
      label,
      href,
      icon,
      permission,
      visibleTo,
      position,
    })),
  });
}
