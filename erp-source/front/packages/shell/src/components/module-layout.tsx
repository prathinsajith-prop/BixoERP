"use client";

import React from "react";
import { AuthGuard } from "./auth-guard";
import { ModuleSidebar } from "./module-sidebar";
import { TopBar } from "./top-bar";
import { ModuleFooter } from "./module-footer";
import { PageTitleProvider } from "../context/page-title";

interface ModuleLayoutProps {
  /** Module identifier, e.g. "hr", "finance", "sales". Pass "portal" for the core/portal app. */
  moduleId: string;
  children: React.ReactNode;
}

/**
 * Shared layout for all ERP modules.
 * Renders: AuthGuard → PageTitleProvider → ModuleSidebar + TopBar → Content → Footer.
 *
 * Usage in a module's layout.tsx:
 *   import { ModuleLayout } from "@erp/shell";
 *   <ModuleLayout moduleId="hr">{children}</ModuleLayout>
 */
export function ModuleLayout({ moduleId, children }: ModuleLayoutProps) {
  return (
    <AuthGuard>
      <PageTitleProvider>
        <div className="flex min-h-screen" style={{ backgroundColor: 'var(--gogo-bg-default)' }}>
          <ModuleSidebar moduleId={moduleId} />
          <div className="flex min-h-screen flex-1 flex-col pb-16 md:pb-0 md:pl-[80px]">
            <TopBar moduleId={moduleId} />
            <div className="mx-auto w-full max-w-7xl flex-1 px-6">{children}</div>
          </div>
        </div>
        <ModuleFooter />
      </PageTitleProvider>
    </AuthGuard>
  );
}
