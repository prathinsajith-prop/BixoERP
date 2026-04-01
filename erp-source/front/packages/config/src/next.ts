import type { NextConfig } from "next";

const SHARED_PACKAGES = ["@erp/ui", "@erp/shared", "@erp/api-client", "@erp/shell", "@erp/config"];

const SERVICE_ROUTES = [
  { path: "auth", host: "core", port: 3015 },
  { path: "finance", host: "finance-svc", port: 3001 },
  { path: "apar", host: "apar-svc", port: 3002 },
  { path: "hr", host: "hr-svc", port: 3003 },
  { path: "sales", host: "sales-svc", port: 3004 },
  { path: "inventory", host: "inventory-svc", port: 3005 },
  { path: "procurement", host: "procurement-svc", port: 3006 },
  { path: "manufacturing", host: "manufacturing-svc", port: 3007 },
  { path: "projects", host: "project-svc", port: 3008 },
  { path: "workflow", host: "workflow-svc", port: 3009 },
  { path: "notifications", host: "notification-svc", port: 3010 },
  { path: "files", host: "files-svc", port: 3011 },
  { path: "integrations", host: "integration-svc", port: 3012 },
  { path: "reports", host: "report-svc", port: 3013 },
  { path: "audit", host: "audit-svc", port: 3014 },
];

/** Micro-frontend apps served on their own containers */
const FRONTEND_ROUTES = [
  { path: "finance", host: "finance-frontend", port: 4001 },
  { path: "apar", host: "apar-frontend", port: 4002 },
  { path: "hr", host: "hr-frontend", port: 4003 },
  { path: "inventory", host: "inventory-frontend", port: 4004 },
  { path: "procurement", host: "procurement-frontend", port: 4005 },
  { path: "manufacturing", host: "manufacturing-frontend", port: 4006 },
  { path: "sales", host: "sales-frontend", port: 4007 },
  { path: "projects", host: "projects-frontend", port: 4008 },
  { path: "reports", host: "reports-frontend", port: 4009 },
  { path: "workflow", host: "workflow-frontend", port: 4010 },
  { path: "notifications", host: "notifications-frontend", port: 4011 },
  { path: "files", host: "files-frontend", port: 4012 },
  { path: "audit", host: "audit-frontend", port: 4013 },
  { path: "integrations", host: "integrations-frontend", port: 4014 },
];

function getServiceUrl(host: string, port: number): string {
  return process.env.DOCKER_ENV === "true"
    ? `http://${host}:${port}`
    : `http://localhost:${port}`;
}

/**
 * Create a Next.js config for a micro-frontend service app.
 *
 * @param moduleId  - The module identifier (e.g. "finance", "hr")
 * @param overrides - Additional Next.js config to merge
 */
export function createServiceConfig(
  moduleId: string,
  overrides: Partial<NextConfig> = {}
): NextConfig {
  return {
    basePath: `/${moduleId}`,
    output: 'standalone',
    transpilePackages: SHARED_PACKAGES,
    ...overrides,
  };
}

/**
 * Create a Next.js config for the portal (no basePath).
 */
export function createPortalConfig(overrides: Partial<NextConfig> = {}): NextConfig {
  return {
    output: 'standalone',
    transpilePackages: SHARED_PACKAGES,
    async rewrites() {
      const apiRewrites = SERVICE_ROUTES.map(({ path, host, port }) => ({
        source: `/api/v1/${path}/:rest*`,
        destination: `${getServiceUrl(host, port)}/api/v1/${path}/:rest*`,
      }));

      // Proxy micro-frontend apps through the portal
      const frontendRewrites = FRONTEND_ROUTES.map(({ path, host, port }) => ({
        source: `/${path}/:rest*`,
        destination: `${getServiceUrl(host, port)}/${path}/:rest*`,
      }));

      return [...apiRewrites, ...frontendRewrites];
    },
    ...overrides,
  };
}
