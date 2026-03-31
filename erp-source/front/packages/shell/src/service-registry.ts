/**
 * Service registry for micro-frontend URL resolution.
 *
 * In development each service runs on its own port.
 * In production a reverse-proxy (nginx / Kong) maps basePaths to services
 * so cross-module links are just relative paths on the same origin.
 */

export const SERVICE_PORTS: Record<string, number> = {
  portal: 3000,
  finance: 3001,
  apar: 3002,
  hr: 3003,
  inventory: 3004,
  sales: 3005,
  procurement: 3006,
  manufacturing: 3007,
  projects: 3008,
  reports: 3009,
  workflow: 3010,
  notifications: 3011,
  files: 3012,
  audit: 3013,
  integrations: 3014,
};

/**
 * Resolve the URL for a given service module.
 *
 * @param moduleId - e.g. "finance", "hr", "portal"
 * @param path     - optional sub-path (must start with "/" or be empty)
 */
export function getServiceUrl(moduleId: string, path = ""): string {
  const port = SERVICE_PORTS[moduleId];
  const basePath = moduleId === "portal" ? "" : `/${moduleId}`;

  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    return `http://localhost:${port}${basePath}${path}`;
  }

  // Production: all services behind one origin
  return `${basePath}${path}` || "/";
}

/** Shorthand for portal URL */
export function getPortalUrl(path = ""): string {
  return getServiceUrl("portal", path);
}
