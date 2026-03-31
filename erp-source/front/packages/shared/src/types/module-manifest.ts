// ─── Module Manifest Type ─────────────────────────
// Defines the shape of each module's manifest.json file.
// Used to declare navigation, roles, permissions, entities, events, API endpoints, and operational config.

export interface ManifestNavItem {
  label: string;
  href: string;
  icon: string;
  /** Permission required to access this nav item. */
  permission?: string;
  /** Role IDs that can see this menu item. Empty / omitted = visible to all authenticated users. */
  visibleTo?: string[];
  position?: number;
  children?: ManifestNavItem[];
}

export interface ManifestRole {
  id: string;
  name: string;
  description: string;
  /** Permission scopes granted to this role. Use "module:*" for full access. */
  scopes: string[];
}

export interface ManifestPermissionAction {
  /** Unique scope ID, e.g. "hr:employee.read" */
  id: string;
  name: string;
  description: string;
}

export interface ManifestPermissionGroup {
  /** Resource name, e.g. "employee", "payroll" */
  resource: string;
  actions: ManifestPermissionAction[];
}

export interface ManifestEntityField {
  name: string;
  type: "uuid" | "string" | "email" | "text" | "integer" | "decimal" | "boolean" | "date" | "timestamp" | "enum" | "json";
  required: boolean;
  readonly: boolean;
  sensitive?: boolean;
  enum_values?: string[];
}

export interface ManifestEntity {
  name: string;
  plural: string;
  icon: string;
  table: string;
  primary_key: string;
  apiPath: string;
  sync_enabled?: boolean;
  sync_direction?: "bidirectional" | "push_to_core" | "pull_from_core";
  fields: ManifestEntityField[];
  indexes?: string[];
  soft_delete?: boolean;
  deleted_at_field?: string;
}

export interface ManifestEvent {
  name: string;
  description: string;
}

export interface ManifestSubscribedEvent {
  name: string;
  handler: string;
}

export interface ManifestEvents {
  published: ManifestEvent[];
  subscribed: ManifestSubscribedEvent[];
}

export interface ManifestEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  scope: string;
}

export interface ManifestApi {
  base_path: string;
  auth: "bearer_token" | "api_key" | "oauth2";
  rate_limit: {
    requests_per_minute: number;
    burst: number;
  };
  endpoints: ManifestEndpoint[];
}

export interface ManifestWidget {
  id: string;
  label: string;
  dashboard: boolean;
  size: "small" | "medium" | "large";
}

export interface ManifestDependency {
  module: string;
  version: string;
  optional: boolean;
}

export interface ManifestSyncConfig {
  strategy: "full" | "incremental";
  direction: "bidirectional" | "push" | "pull";
  trigger: "event_driven" | "polling" | "manual";
  polling_interval_seconds?: number;
  retry_policy: {
    max_attempts: number;
    backoff_strategy: "exponential" | "linear" | "fixed";
    initial_delay_ms: number;
  };
  conflict_resolution: "last_write_wins" | "manual" | "server_wins" | "client_wins";
  batch_size: number;
}

export interface ModuleManifest {
  manifest_version: string;

  module: {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    license: string;
    namespace: string;
  };

  compatibility: {
    core_min_version: string;
    core_max_version: string;
    api_version: string;
    dependencies: ManifestDependency[];
  };

  sync: ManifestSyncConfig;

  ui: {
    icon: string;
    color: string;
    basePath: string;
    position: number;
    menu: ManifestNavItem[];
    widgets: ManifestWidget[];
  };

  ports: {
    frontend: number;
    backend: number;
  };

  tier: "critical" | "standard" | "best-effort";

  roles: ManifestRole[];
  permissions: ManifestPermissionGroup[];
  entities: ManifestEntity[];
  events: ManifestEvents;
  api: ManifestApi;

  health_check: {
    endpoint: string;
    interval_seconds: number;
    timeout_seconds: number;
  };

  logging: {
    level: "debug" | "info" | "warn" | "error";
    audit_trail: boolean;
    sensitive_fields_masked: string[];
  };
}
