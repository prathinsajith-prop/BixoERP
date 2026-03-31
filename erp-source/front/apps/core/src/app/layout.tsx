import type { Metadata } from "next";
import { ThemeProvider } from "@erp/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bixo ERP",
  description: "Bixo — Enterprise Resource Planning",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
