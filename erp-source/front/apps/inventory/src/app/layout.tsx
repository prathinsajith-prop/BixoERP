import type { Metadata } from "next";
import { ModuleLayout, ThemeProvider } from "@erp/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory — Bixo",
  description: "Stock Levels, Warehouses, Movements, Reorder Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <ModuleLayout moduleId="inventory">{children}</ModuleLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
