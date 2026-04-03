"use client";

import React from "react";
import { APP_NAME } from "../lib/config";

export function ModuleFooter() {
  return (
    <footer className="hidden border-t border-[var(--gogo-divider)] bg-transparent md:block">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/status"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-emerald-600"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </a>
            <span className="text-xs text-gray-400">v2.4.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
