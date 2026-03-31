import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "projects",
    moduleName: "Projects",
    items: [
      { label: "Dashboard", href: "/projects", icon: "LayoutDashboard" },
      { label: "All Projects", href: "/projects/list", icon: "FolderKanban" },
      { label: "Tasks", href: "/projects/tasks", icon: "CheckSquare" },
      { label: "Time Tracking", href: "/projects/time", icon: "Timer" },
    ],
  });
}
