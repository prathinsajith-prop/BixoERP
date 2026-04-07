"use client";

import { useState, useEffect } from "react";
import { AppSelector } from "./app-selector";
import { AlertsDropdown } from "./alerts-dropdown";
import { authApi } from "../lib/api/auth";
import { filesApi } from "../lib/api/files";

const ORG_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-indigo-500 to-blue-600",
];

interface OrgRaw {
  organizationId?: string;
  id?: string;
  name: string;
  slug?: string;
  role?: string;
  logoUrl?: string;
}

interface Org {
  id: string;
  name: string;
  logoUrl?: string;
}

function normalizeOrg(o: OrgRaw): Org {
  return { id: o.organizationId || o.id || "", name: o.name, logoUrl: o.logoUrl };
}

/* ─── OrgBadge: display-only org identity for the header ─── */
function OrgBadge() {
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [gradientIdx, setGradientIdx] = useState(0);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .myOrganizations()
      .then((res: { data?: { data?: OrgRaw[] } }) => {
        const list = (res.data?.data || []).map(normalizeOrg);
        const storedId =
          typeof window !== "undefined"
            ? localStorage.getItem("organizationId")
            : null;
        const idx = list.findIndex((o) => o.id === storedId);
        const org = (idx >= 0 ? list[idx] : list[0]) ?? null;
        setCurrentOrg(org);
        setGradientIdx(idx >= 0 ? idx : 0);
        if (org?.logoUrl) {
          const match = org.logoUrl.match(/\/files\/([0-9a-f-]+)\/download/);
          if (match) {
            filesApi.download(match[1]).then((url: string | null) => { if (url) setLogoBlobUrl(url); }).catch(() => { });
          } else {
            setLogoBlobUrl(org.logoUrl);
          }
        }
      })
      .catch(() => { });
  }, []);

  if (!currentOrg) return null;

  const gradient = ORG_GRADIENTS[gradientIdx % ORG_GRADIENTS.length];
  const initial = currentOrg.name?.charAt(0)?.toUpperCase() || "O";

  return (
    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5">
      {logoBlobUrl ? (
        <img
          src={logoBlobUrl}
          alt={currentOrg.name}
          className="h-7 w-7 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-gray-200/60 dark:ring-gray-700/60"
        />
      ) : (
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-[11px] font-bold text-white shadow-sm`}
        >
          {initial}
        </div>
      )}
      <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[180px] truncate">
        {currentOrg.name}
      </span>
    </div>
  );
}

export function TopBar({ moduleId }: { moduleId?: string }) {
  return (
    <div className="gogo-header flex w-full items-center justify-between border-b border-[var(--gogo-divider)] bg-white px-5 md:px-6 dark:bg-[var(--gogo-surface)]">
      <div className="flex shrink-0 items-center">
        <OrgBadge />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AppSelector />
        <AlertsDropdown />
      </div>
    </div>
  );
}

