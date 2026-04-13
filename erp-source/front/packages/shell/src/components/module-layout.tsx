"use client";

import React, { useEffect, useState } from "react";
import { AuthGuard } from "./auth-guard";
import { ModuleSidebar } from "./module-sidebar";
import { TopBar } from "./top-bar";
import { ModuleFooter } from "./module-footer";
import { PageTitleProvider } from "../context/page-title";
import { useAuthStore } from "../store/auth";
import { authApi } from "../lib/api/auth";

interface ModuleConfigRow {
  moduleId?: string;
  moduleKey?: string;
  enabled?: boolean;
}

function normalizeModuleId(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null;
  return value.trim().toLowerCase().replace(/_module$/, '');
}

function extractModuleConfigs(payload: unknown): ModuleConfigRow[] {
  const root = payload as { data?: unknown } | undefined;
  const inner = (root?.data as { data?: unknown } | undefined)?.data;
  if (Array.isArray(inner)) return inner as ModuleConfigRow[];
  if (Array.isArray(root?.data)) return root?.data as ModuleConfigRow[];
  if (Array.isArray(payload)) return payload as ModuleConfigRow[];
  return [];
}

function configMatchesModule(config: ModuleConfigRow, moduleId: string): boolean {
  const target = normalizeModuleId(moduleId);
  if (!target) return false;
  const keys = [normalizeModuleId(config.moduleKey), normalizeModuleId(config.moduleId)].filter(Boolean);
  return keys.includes(target);
}

interface ModuleLayoutProps {
  /** Module identifier, e.g. "hr", "finance", "sales". Pass "portal" for the core/portal app. */
  moduleId: string;
  children: React.ReactNode;
}

/**
 * Guards module access — redirects to home if the current moduleId is disabled for the
 * user's organisation. Renders after AuthGuard so the token is available when we check.
 */
function ModuleAccessCheck({ moduleId, children }: { moduleId: string; children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const check = async () => {
      // Portal / core app is always accessible — skip the check
      if (!moduleId || moduleId === 'portal') {
        if (active) setAllowed(true);
        return;
      }
      if (!isAuthenticated) return; // wait for AuthGuard to complete

      setAllowed((prev) => (prev === null ? null : prev));

      try {
        const res = await authApi.listModuleConfigs();
        const configs = extractModuleConfigs(res.data);
        if (configs.length === 0) {
          // No configs yet (e.g. fresh deploy) — fail-open
          if (active) setAllowed(true);
          return;
        }
        const found = configs.find((c) => configMatchesModule(c, moduleId));
        // If the module isn't registered at all → fail-open (allow access)
        if (active) setAllowed(!found || !!found.enabled);
      } catch {
        // Keep prior decision if we already have one; otherwise fail-open.
        if (active) setAllowed((prev) => prev ?? true);
      }
    };

    void check();
    return () => {
      active = false;
    };
  }, [moduleId, isAuthenticated]);

  // Re-check whenever module config changes (e.g. admin disables the module live)
  useEffect(() => {
    let active = true;

    const handler = () => {
      if (!moduleId || moduleId === 'portal' || !isAuthenticated) return;
      authApi
        .listModuleConfigs()
        .then((res) => {
          const configs = extractModuleConfigs(res.data);
          if (configs.length === 0) {
            if (active) setAllowed(true);
            return;
          }
          const found = configs.find((c) => configMatchesModule(c, moduleId));
          if (active) setAllowed(!found || !!found.enabled);
        })
        .catch(() => { });
    };
    window.addEventListener('erp:module-config-changed', handler);
    return () => {
      active = false;
      window.removeEventListener('erp:module-config-changed', handler);
    };
  }, [moduleId, isAuthenticated]);

  // Redirect to home when module is disabled
  useEffect(() => {
    if (allowed === false) {
      window.location.replace('/');
    }
  }, [allowed]);

  if (allowed === null) {
    // Show a minimal spinner while the access check is in-flight
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />
      </div>
    );
  }

  if (allowed === false) return null;

  return <>{children}</>;
}

/**
 * Shared layout for all ERP modules.
 * Renders: AuthGuard → ModuleAccessCheck → PageTitleProvider → ModuleSidebar + TopBar → Content → Footer.
 *
 * Usage in a module's layout.tsx:
 *   import { ModuleLayout } from "@erp/shell";
 *   <ModuleLayout moduleId="hr">{children}</ModuleLayout>
 */
export function ModuleLayout({ moduleId, children }: ModuleLayoutProps) {
  return (
    <AuthGuard>
      <ModuleAccessCheck moduleId={moduleId}>
        <PageTitleProvider>
          <div className="min-h-screen bg-[var(--gogo-bg-default)]">
            <TopBar moduleId={moduleId} />
            <ModuleSidebar moduleId={moduleId} />
            <div className="flex min-h-screen min-w-0 flex-col pb-16 pt-[var(--gogo-header-height)] md:ml-[var(--gogo-sidebar-width)] md:pb-[var(--gogo-footer-height)]">
              <main className="flex flex-1 flex-col">
                <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-4 pb-10 sm:px-6 sm:pt-6 lg:px-10">
                  {children}
                </div>
              </main>
              <ModuleFooter />
            </div>
          </div>
        </PageTitleProvider>
      </ModuleAccessCheck>
    </AuthGuard>
  );
}
