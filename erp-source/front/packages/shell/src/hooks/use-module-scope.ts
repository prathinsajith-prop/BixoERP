"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/auth";
import { authApi } from "../lib/api/auth";

/**
 * Auto-scopes the JWT to only contain permissions for the given module.
 * Call this once at the module's root layout level.
 * On mount it checks if the token is already scoped for this module;
 * if not, it requests a scoped token from the backend.
 */
export function useModuleScope(moduleId: string) {
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    const { activeModule, fullAccessToken, accessToken } = useAuthStore.getState();

    // Already scoped for this module
    if (activeModule === moduleId) return;

    // Save the current full token in memory only (never localStorage)
    const tokenToPreserve = fullAccessToken || accessToken;
    if (tokenToPreserve && !fullAccessToken) {
      useAuthStore.setState({ fullAccessToken: tokenToPreserve });
    }

    // Use the full token for the scope request
    const requestToken = tokenToPreserve;
    if (!requestToken) return;

    requested.current = true;

    // Temporarily set full token as active so the API call authenticates with full permissions
    useAuthStore.setState({ accessToken: requestToken });

    authApi
      .scopeToken({ module: moduleId })
      .then(({ data }) => {
        const scopedToken = data.data.accessToken;
        // Scoped access token stays in memory; only non-sensitive module ID goes to sessionStorage
        sessionStorage.setItem("activeModule", moduleId);
        useAuthStore.setState({ accessToken: scopedToken, activeModule: moduleId });
      })
      .catch(() => {
        // If scoping fails, keep the full token
        sessionStorage.setItem("activeModule", moduleId);
        useAuthStore.setState({ activeModule: moduleId });
      });
  }, [moduleId]);
}
