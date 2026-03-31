"use client";

import { useCurrentUser, useAuthStore } from "@erp/shell";
import manifest from "../../../manifest.json";

export default function DebugPage() {
  const user = useCurrentUser();
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Debug — HR Module</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Raw JWT Token</h2>
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-800 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 break-all whitespace-pre-wrap max-h-40">
          {accessToken ?? "No token"}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">JWT Payload (decoded)</h2>
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-800 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700">
          {user ? JSON.stringify(user, null, 2) : "No token / not authenticated"}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Module Manifest</h2>
        <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-800 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-700 max-h-[70vh]">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      </section>
    </div>
  );
}
