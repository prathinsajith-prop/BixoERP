import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    moduleId: "files",
    moduleName: "Files",
    items: [
      { label: "All Files", href: "/files", icon: "FolderOpen" },
      { label: "Upload", href: "/files/upload", icon: "Upload" },
    ],
  });
}
