import { ModuleLayout } from "@erp/shell";
import { OrgProvider } from "@/context/org";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <ModuleLayout moduleId="portal">
        {children}
      </ModuleLayout>
    </OrgProvider>
  );
}
