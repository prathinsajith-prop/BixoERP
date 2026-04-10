"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Alert, DataTable, Input, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type Vendor } from "../../lib/api";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.vendors.list();
      setVendors(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = vendors.filter((v) =>
    !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.code.includes(search)
  );

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Vendor", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description={`${vendors.length} vendors`}
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="relative max-w-sm">
        <Input
          type="text"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const vendorColumns: TableColumn<Vendor>[] = [
          { key: 'code', header: 'Code', render: (v) => <span className="text-sm font-mono text-gray-700">{v.code}</span> },
          { key: 'name', header: 'Name', render: (v) => <span className="text-sm font-medium text-gray-900">{v.name}</span> },
          { key: 'email', header: 'Email', render: (v) => <span className="text-sm text-gray-500">{v.email}</span> },
          { key: 'phone', header: 'Phone', render: (v) => <span className="text-sm text-gray-500">{v.phone}</span> },
          { key: 'paymentTerms', header: 'Payment Terms', render: (v) => <span className="text-sm text-gray-500">{v.paymentTerms}</span> },
          {
            key: 'isActive', header: 'Status', render: (v) => <StatusBadge status={v.isActive ? 'Active' : 'Inactive'} />,
          },
        ];
        return filtered.length === 0
          ? <EmptyState title="No vendors found" description="Try adjusting your search." />
          : <DataTable<Vendor> columns={vendorColumns} data={filtered} keyExtractor={(v) => v.id} />;
      })()}
    </div>
  );
}
