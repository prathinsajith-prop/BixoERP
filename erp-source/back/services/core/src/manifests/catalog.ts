// Catalog of all ERP module manifests.
// Uses explicit require() to avoid TypeScript default-import ambiguity with JSON files in CommonJS mode.
// JSON files are copied by nest-cli.json assets config from src/manifests/ → dist/manifests/.
// Falls back gracefully if a file is missing so the service never crashes on startup.

import * as path from 'path';

export interface CatalogEntry {
    moduleId: string;
    moduleKey: string;
    tier: string;
    manifestVersion: string;
    manifest: Record<string, unknown> | null;
}

// Module registry — order determines display position
const KNOWN_MODULES: { file: string; key: string; tier: string }[] = [
    { file: 'finance_module', key: 'finance', tier: 'standard' },
    { file: 'apar_module', key: 'apar', tier: 'standard' },
    { file: 'hr_module', key: 'hr', tier: 'standard' },
    { file: 'inventory_module', key: 'inventory', tier: 'standard' },
    { file: 'sales_module', key: 'sales', tier: 'standard' },
    { file: 'procurement_module', key: 'procurement', tier: 'standard' },
    { file: 'manufacturing_module', key: 'manufacturing', tier: 'standard' },
    { file: 'projects_module', key: 'projects', tier: 'standard' },
    { file: 'reports_module', key: 'reports', tier: 'intelligence' },
    { file: 'workflow_module', key: 'workflow', tier: 'standard' },
    { file: 'notifications_module', key: 'notifications', tier: 'standard' },
    { file: 'files_module', key: 'files', tier: 'platform' },
    { file: 'audit_module', key: 'audit', tier: 'governance' },
    { file: 'integrations_module', key: 'integrations', tier: 'platform' },
];

// eslint-disable-next-line @typescript-eslint/no-var-requires
const loadManifestFile = (name: string): Record<string, unknown> | null => {
    try {
        // At runtime, __dirname = dist/manifests/. Files are copied there by nest-cli.json assets.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const m: Record<string, unknown> = require(path.join(__dirname, `${name}.json`));
        return m;
    } catch {
        return null;
    }
};

export const MODULE_CATALOG: CatalogEntry[] = KNOWN_MODULES.map(({ file, key, tier }) => {
    const m = loadManifestFile(file);
    const mod = m ? (m['module'] as Record<string, string> | undefined) : undefined;
    return {
        moduleId: mod?.id ?? `${file}`,
        moduleKey: key,
        tier: (m?.['tier'] as string | undefined) ?? tier,
        manifestVersion: mod?.version ?? '1.0.0',
        manifest: m,
    };
});

/** Look up by moduleId (e.g. "hr_module") or moduleKey (e.g. "hr") */
export const MANIFEST_BY_ID: Record<string, CatalogEntry> = {};
for (const entry of MODULE_CATALOG) {
    MANIFEST_BY_ID[entry.moduleId] = entry;
    MANIFEST_BY_ID[entry.moduleKey] = entry;
}

