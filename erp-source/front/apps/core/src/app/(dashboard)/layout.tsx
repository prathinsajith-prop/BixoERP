import { ModuleLayout } from "@erp/shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLayout moduleId="portal">
      {children}
    </ModuleLayout>
  );
}
