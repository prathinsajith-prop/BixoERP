"use client";

import { useModuleScope } from "@erp/shell";

export function HRModuleScope({ children }: { children: React.ReactNode }) {
  useModuleScope("hr");
  return <>{children}</>;
}
