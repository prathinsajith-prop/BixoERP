import { NextRequest, NextResponse } from "next/server";
import manifest from "../../../../manifest.json";

export async function GET(req: NextRequest) {
  let featureFlags: Record<string, boolean> = {};

  try {
    const coreUrl = process.env.CORE_API_URL ?? 'http://localhost:4000';
    const authorization = req.headers.get('authorization') ?? '';
    const res = await fetch(
      `${coreUrl}/api/v1/auth/modules/org/current/feature-flags/${manifest.module.id}`,
      {
        headers: { ...(authorization ? { authorization } : {}) },
        next: { revalidate: 0 },
      }
    );
    if (res.ok) {
      const body = await res.json();
      featureFlags = body?.data?.featureFlags ?? body?.featureFlags ?? {};
    }
  } catch {
    // fail-open: show all items if core is unreachable
  }

  const allItems = manifest.ui.menu.map(({ label, href, icon, permission, visibleTo, position }: {
    label: string; href: string; icon: string; permission?: string; visibleTo?: string[]; position?: number;
  }) => ({ label, href, icon, permission, visibleTo, position }));

  // Filter out items whose permission feature flag is explicitly disabled
  const items = allItems.filter((item) =>
    !item.permission || featureFlags[item.permission] !== false
  );

  return NextResponse.json({
    moduleId: manifest.module.id,
    moduleName: manifest.module.name,
    items,
  });
}
