import type { Metadata } from "next";
import { ModuleLayout, ModuleStartup, ThemeProvider } from "@erp/shell";
import "./globals.css";

export const metadata: Metadata = { title: "Files — Bixo", description: "Document Management & File Storage" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <ModuleLayout moduleId="files">{children}</ModuleLayout>
        </ThemeProvider>
        <ModuleStartup />
      </body>
    </html>
  );
}
