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
        <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--gogo-bg-default)' }}>
          <TopBar moduleId={moduleId} />
          <div className="flex flex-1 pb-16 md:pb-0">
            <ModuleSidebar moduleId={moduleId} />
            <div className="flex flex-1 flex-col md:pl-[80px]">
              <div className="mx-auto w-full max-w-7xl flex-1 px-6 pt-6 pb-10">{children}</div>
            </div>
          </div>
        </div>
        <ModuleFooter />
      </PageTitleProvider>
    </AuthGuard>
  );
}
