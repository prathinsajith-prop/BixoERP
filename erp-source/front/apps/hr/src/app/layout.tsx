import type { Metadata } from "next";
import { ModuleLayout, ThemeProvider } from "@erp/shell";
import { HRModuleScope } from "./module-scope";
import "./globals.css";

export const metadata: Metadata = {
  title: "Human Resources — Bixo",
  description: "Employees, Departments, Payroll, Leave Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <ModuleLayout moduleId="hr">
            <HRModuleScope>
              {children}
            </HRModuleScope>
          </ModuleLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
