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
        <div className="flex min-h-screen bg-[var(--gogo-bg-default)]">
          <ModuleSidebar moduleId={moduleId} />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col pb-16 md:ml-[calc(var(--gogo-sidebar-width)+12px)] md:pb-0">
            <TopBar moduleId={moduleId} />
            <main className="flex flex-1 flex-col">
              <div className="mx-auto w-full max-w-[1200px] flex-1 px-8 pt-6 pb-10 lg:px-10">
                {children}
              </div>
            </main>
            <ModuleFooter />
          </div>
        </div>
      </PageTitleProvider>
    </AuthGuard>
  );
}
