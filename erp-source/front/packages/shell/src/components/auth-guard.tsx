"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrate } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    hydrate();
    setChecked(true);
  }, [hydrate]);

  useEffect(() => {
    if (checked && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [checked, isAuthenticated]);

  if (!checked || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
