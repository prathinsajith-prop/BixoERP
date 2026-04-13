'use client';

import { useEffect } from 'react';

/**
 * Drop this into any module app's root layout.
 * On first mount it fires a single GET /api/startup request which
 * registers the module's manifest with the core service.
 * The route handler itself is idempotent (module-level `registered` flag).
 */
export function ModuleStartup() {
    useEffect(() => {
        fetch('/api/startup').catch(() => {
            // Silently ignore — core may not be up yet; the next startup will retry.
        });
    }, []);

    return null;
}
