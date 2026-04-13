import type { Metadata } from "next";
import { ModuleLayout, ModuleStartup, ThemeProvider } from "@erp/shell";
import { Toaster } from 'sonner';
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
          <Toaster position="top-right" richColors closeButton duration={4000} />
          <ModuleLayout moduleId="hr">
            <HRModuleScope>
              {children}
            </HRModuleScope>
          </ModuleLayout>
        </ThemeProvider>
        <ModuleStartup />
      </body>
    </html>
  );
}
