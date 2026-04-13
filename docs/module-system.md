# Manifest-Driven Module System

**Branch:** `feature/ui-theming`  
**Scope:** Super-admin org module management · Manifest versioning · Feature-level toggles

---

## Overview

Bixo ERP is built as a collection of independent modules (HR, Finance, AP/AR, Inventory, etc.). The **Manifest-Driven Module System** lets super-admins control exactly which modules — and which features within those modules — are available to each organization.

Every module ships with a `manifest.json` file. That file is the single source of truth for everything the module can do. The database stores per-org state on top of that truth.

---

## How It Works — End to End

### 1. Module registers itself on startup

When any module app boots (HR, Finance, etc.), `ModuleStartup` fires a `GET /api/startup` call. The startup route posts the app's `manifest.json` to the core service:

```
POST http://core:3015/api/v1/auth/modules/register
Headers: X-Internal-Secret: <INTERNAL_API_SECRET>
Body: <full manifest.json>
```

The core service:
- Computes a **SHA-256 hash** of the manifest
- If the module is **new** → inserts a row into `module_registry`
- If the manifest **changed** (hash differs) → updates `module_registry`, sets `pending_version` on all orgs that had already adopted the old version
- If the hash is **identical** → no-op (idempotent)

This means version updates are detected automatically when a module redeploys.

---

### 2. Super-admin manages modules per org

The core admin UI (`/admin/modules`) provides a two-panel interface:

**Left panel:** List of all organizations with a quick summary (N active modules, pending update badge).

**Right panel:**
- **No org selected** → Global Module Registry view: shows all registered modules, their versions, tier, description, feature count
- **Org selected** → That org's module state: each module card shows its enabled/disabled state, version, and feature flags

---

### 3. Two-level control

#### Level 1 — Module on/off

`PATCH /api/v1/auth/modules/org/:orgId/:moduleId`  
Body: `{ "enabled": true }`

When **enabling** a module:
1. Backend checks all required dependencies from `manifest.compatibility.dependencies` are already enabled for this org. If not → `409 Conflict` with `missingDependencies`.
2. Builds default `featureFlags` from the manifest — every action set to `true`.
3. Upserts `org_module_configs` with `enabled=true`, `adoptedVersion`, `activatedAt`, `activatedBy`.
4. Seeds all permissions from the manifest into the `permissions` table (scoped by `tenantId`).

When **disabling** a module:
1. Backend checks no currently-enabled module depends on this one. If found → `409` with `conflictingModules`.
2. Sets `enabled=false`, `deactivatedAt`. Preserves all `featureFlags` and version data for easy re-enable.

#### Level 2 — Feature flags (within a module)

`PATCH /api/v1/auth/modules/org/:orgId/:moduleId`  
Body: `{ "featureFlags": { "hr:payroll.read": false } }`

Feature flags are a `JSONB` map of permission IDs to booleans:
```json
{
  "hr:employee.read": true,
  "hr:employee.write": true,
  "hr:payroll.read": false,
  "hr:payroll.write": false
}
```

Partial merge — only the keys included in the body are updated. Unmentioned keys stay as-is.

---

### 4. Sidebar filtering

`app-selector.tsx` in the shell package calls `GET /api/v1/auth/modules` (legacy endpoint) on mount and whenever a `module-config-changed` or `erp:module-config-changed` event fires on `window`.

Only modules where `enabled === true` appear in the sidebar. The result is cached in `sessionStorage` under `erp_enabled_modules` to avoid flash on page load.

---

### 5. Menu item filtering

Each module app has its own `/api/menu` route. For HR:

```
GET /api/menu
Headers: Authorization: Bearer <token>
```

The route:
1. Fetches `featureFlags` for this module from core: `GET /api/v1/auth/modules/org/current/feature-flags/hr_module`
2. Filters `manifest.ui.menu` items: any item whose `permission` key has `featureFlags[permission] === false` is hidden
3. **Fail-open**: if core is unreachable, all menu items are shown

---

### 6. Version adoption

When a module redeploys with a new `manifest.json`, the system:
1. Updates `module_registry.currentVersion` and `pendingVersion` on all adopting orgs
2. The org's module card in the admin UI shows an update banner: "v1.0.0 → v1.1.0"

The super-admin reviews what changed (new/removed permissions, new menu items, changed roles) and clicks **"Adopt update"**:

```
PATCH /api/v1/auth/modules/org/:orgId/:moduleId
Body: { "adoptVersion": true }
```

This:
- Moves `pendingVersion` → `adoptedVersion`
- Re-seeds permissions for the new manifest version
- New features in the new version default to `enabled: true` in featureFlags

**This is always explicit** — a new version is never auto-applied.

---

### 7. Preset application (new org setup)

When creating a new org, the two-step creation flow lets the admin pick a preset:

| Preset | Modules |
|--------|---------|
| Starter | Workflow, Notifications, Files, Audit |
| Standard (recommended) | Starter + HR, Finance, AP/AR, Reports |
| Full | All registered modules |

```
POST /api/v1/auth/modules/org/:orgId/apply-defaults
Body: { "preset": "standard" }
```

The backend enables each module in the preset list in sequence, checking dependencies as it goes.

---

## Database Schema

### `module_registry` — Global catalog

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `module_id` | TEXT UNIQUE | e.g. `hr_module` |
| `module_key` | TEXT UNIQUE | e.g. `hr` |
| `module_name` | TEXT | e.g. `Human Resources` |
| `current_version` | TEXT | e.g. `1.1.0` |
| `previous_version` | TEXT | e.g. `1.0.0` before upgrade |
| `manifest` | JSONB | Full manifest stored as-is |
| `manifest_hash` | TEXT | SHA-256 of manifest JSON |
| `tier` | TEXT | `standard` / `premium` / `enterprise` |
| `registered_at` | TIMESTAMPTZ | First registration |
| `updated_at` | TIMESTAMPTZ | Last manifest update |

### `org_module_configs` — Per-org state

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | PK |
| `org_id` | UUID | Organization FK |
| `module_id` | TEXT | e.g. `hr_module` |
| `module_key` | TEXT | e.g. `hr` |
| `enabled` | BOOLEAN | Is module active for this org |
| `adopted_version` | TEXT | Which version this org is using |
| `pending_version` | TEXT | New version available but not adopted |
| `feature_flags` | JSONB | `{"hr:payroll.read": false, ...}` |
| `activated_at` | TIMESTAMPTZ | When it was enabled |
| `activated_by` | UUID | User who enabled it |
| `deactivated_at` | TIMESTAMPTZ | When it was disabled |
| `notes` | TEXT | Admin notes |

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/modules/register` | X-Internal-Secret | Module registers its manifest |
| `GET` | `/api/v1/auth/modules/registry` | JWT + `auth:organizations:read` | Global module catalog |
| `GET` | `/api/v1/auth/modules/org/current` | JWT | Current org's module configs |
| `GET` | `/api/v1/auth/modules/org/current/feature-flags/:moduleId` | JWT | Feature flags for current org |
| `GET` | `/api/v1/auth/modules/org/:orgId` | JWT + `auth:organizations:read` | Any org's module configs |
| `GET` | `/api/v1/auth/modules/org/:orgId/summary` | JWT + `auth:organizations:read` | Quick summary for org card |
| `PATCH` | `/api/v1/auth/modules/org/:orgId/:moduleId` | JWT + `auth:organizations:write` | Toggle module, update feature flags, adopt version |
| `POST` | `/api/v1/auth/modules/org/:orgId/apply-defaults` | JWT + `auth:organizations:write` | Apply preset |

---

## Frontend Pages Affected

| Page | Path | Change |
|------|------|--------|
| Module Management | `/admin/modules` | Rewritten — two-panel super-admin layout with org selector, registry view, per-org module cards with feature flag expansion |
| Organization Detail | `/admin/organizations/[orgId]` | Added **Modules** tab showing `OrgModulesTab` pre-loaded for this org |
| New Organization | `/admin/organizations/new` | Two-step form: Step 1 = org details, Step 2 = preset selection |
| Permissions | `/admin/permissions` | Permission groups now show module status badge; disabled-module groups are dimmed with amber warning banner |

---

## Current Gaps & Recommended Improvements

### 1. Backend enforcement of feature flags (Critical)

**Current:** Feature flags only affect what's *shown* in the UI (menu items, dimmed permissions). Nothing in the backend API actually checks featureFlags before executing a request.

**Fix needed:** Add a guard in each module's service layer:
```ts
// Before any HR endpoint executes:
const flags = await coreClient.getFeatureFlags('hr_module', orgId);
if (flags['hr:payroll.read'] === false) throw new ForbiddenException();
```
Without this, a user who knows the API URL can still call `GET /hr/payroll` even if payroll is toggled off in the UI. The frontend filtering is UX, not security.

---

### 2. Dependency ordering in preset application

**Current:** `applyModulePreset` iterates the module list and enables each in sequence. If HR (which requires Finance) appears before Finance in the list, HR's enable call will get a 409 because Finance isn't enabled yet.

**Fix:** Topologically sort the enable list using the dependency graph before processing:
```ts
// Sort so dependencies are enabled before dependents
const sorted = topologicalSort(targetModules, dependencyGraph);
```

---

### 3. No caching on feature flag fetches

**Current:** Every menu route request hits `core:3015/api/v1/auth/modules/org/current/feature-flags/hr_module`. With 5+ module apps, each page navigation triggers 5+ calls to core.

**Fix:** Add Redis caching with a short TTL (30–60s), invalidated on `PATCH /modules/org/:orgId/:moduleId`:
```ts
const cacheKey = `feature_flags:${orgId}:${moduleId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
// ... fetch and cache
await redis.setEx(cacheKey, 60, JSON.stringify(flags));
```

---

### 4. `module_id` vs `module_key` ambiguity

**Current:** Two identifiers exist — `moduleId` (e.g. `hr_module`) and `moduleKey` (e.g. `hr`). They're used inconsistently across the frontend, some places send `hr_module`, others send `hr`.

**Fix:** Standardize on `moduleId` everywhere with `_module` suffix, or drop the suffix and use `hr` for both. Pick one convention and enforce it.

---

### 5. No audit trail for module changes

**Current:** `activated_by` records who enabled a module, but there's no history of feature flag changes, version adoptions, or disable events.

**Fix:** Add a `module_audit_log` table:
```sql
CREATE TABLE module_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  action TEXT NOT NULL,       -- 'enabled', 'disabled', 'feature_toggled', 'version_adopted'
  changed_by TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 6. Feature flags not enforced during role assignment

**Current:** The permissions page dims feature-flag-disabled permissions (Task 9), but the role assignment checkboxes still allow selecting any permission regardless of flag state.

**Fix:** Add a backend guard on `POST /api/v1/auth/roles/:id/permissions` to reject permission assignments where `featureFlags[permissionCode] === false`.

---

### 7. `module-config-changed` vs `erp:module-config-changed` dual events

**Current:** Two separate event names fire from two different places. `app-selector.tsx` listens to both. This works but is messy.

**Fix:** Standardise on `erp:module-config-changed` everywhere. Remove the old `module-config-changed` event.

---

## Data Flow Diagram

```
Module App Boot
    │
    ├─ GET /api/startup  (ModuleStartup component fires once)
    │       │
    │       └─ POST /api/v1/auth/modules/register  ──► module_registry (upsert)
    │                                                      │
    │                                              if version changed:
    │                                              org_module_configs.pending_version = new
    │
    │
Super-Admin toggles module ON for Org X
    │
    ├─ PATCH /api/v1/auth/modules/org/:orgId/:moduleId  { enabled: true }
    │       │
    │       ├─ Check dependencies → 409 if missing
    │       ├─ Build default featureFlags (all true)
    │       ├─ Upsert org_module_configs
    │       ├─ Seed permissions into permissions table (scoped to orgId)
    │       └─ Return { enabled, featureFlags, adoptedVersion }
    │
    └─ Frontend dispatches window event 'erp:module-config-changed'
           │
           └─ app-selector.tsx re-fetches enabled modules → sidebar updates


User navigates to HR app
    │
    ├─ Next.js layout.tsx renders → ModuleStartup fires (idempotent)
    │
    └─ Browser fetches GET /api/menu
           │
           ├─ Route calls core: GET /modules/org/current/feature-flags/hr_module
           ├─ Filters manifest.ui.menu by featureFlags
           └─ Returns filtered items to sidebar
```

---

## Environment Variables Required

| Variable | Service | Description |
|----------|---------|-------------|
| `INTERNAL_API_SECRET` | core + all module apps | Shared secret for `/modules/register` |
| `CORE_API_URL` | all module apps | e.g. `http://core:3015` |
| `NEXT_PUBLIC_SELF_URL` | module apps (optional) | Self-URL for relative startup call |
