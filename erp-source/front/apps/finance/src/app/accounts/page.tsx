"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Alert, DataTable, Input, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type Account } from "../../lib/api";

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.accounts.list();
      setAccounts(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = accounts.filter((a) => {
    if (filter !== "all" && a.type !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.code.includes(search)) return false;
    return true;
  });

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Account", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description={`${accounts.length} accounts`}
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {["all", "asset", "liability", "equity", "revenue", "expense"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize ${filter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const accountColumns: TableColumn<Account>[] = [
          { key: 'code', header: 'Code', render: (a) => <span className="text-sm font-mono text-gray-900">{a.code}</span> },
          {
            key: 'name', header: 'Account Name', render: (a) => (
              <div className="flex items-center gap-1">
                {a.parentId && <ChevronRight className="w-3 h-3 text-gray-400 ml-4" />}
                <span className={a.parentId ? 'text-gray-600' : 'font-medium'}>{a.name}</span>
              </div>
            )
          },
          {
            key: 'type', header: 'Type', render: (a) => <StatusBadge status={a.type} />,
          },
          { key: 'normalBalance', header: 'Normal Balance', render: (a) => <span className="text-sm capitalize text-gray-600">{a.normalBalance}</span> },
          {
            key: 'isActive', header: 'Status', render: (a) => <StatusBadge status={a.isActive ? 'Active' : 'Inactive'} />,
          },
        ];
        return filtered.length === 0
          ? <EmptyState title="No accounts found" description="Try adjusting your search or filter." />
          : <DataTable<Account> columns={accountColumns} data={filtered} keyExtractor={(a) => a.id} />;
      })()}
    </div>
  );
}
