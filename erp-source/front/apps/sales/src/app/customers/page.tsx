"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Alert, DataTable, Input, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type Customer } from "../../lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.customers.list();
      setCustomers(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Customer", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${customers.length} customers`}
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const customerColumns: TableColumn<Customer>[] = [
          { key: 'code', header: 'Code', render: (c) => <span className="text-sm font-mono text-gray-700">{c.code}</span> },
          { key: 'name', header: 'Name', render: (c) => <span className="text-sm font-medium text-gray-900">{c.name}</span> },
          { key: 'email', header: 'Email', render: (c) => <span className="text-sm text-gray-500">{c.email}</span> },
          { key: 'phone', header: 'Phone', render: (c) => <span className="text-sm text-gray-500">{c.phone}</span> },
          {
            key: 'creditLimit', header: 'Credit Limit', align: 'right' as const, render: (c) => (
              <span className="text-sm text-gray-900">{c.creditLimit.currency} {c.creditLimit.amount.toLocaleString()}</span>
            )
          },
          {
            key: 'isActive', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'Active' : 'Inactive'} />,
          },
        ];
        return filtered.length === 0
          ? <EmptyState title="No customers found" description="Try adjusting your search." />
          : <DataTable<Customer> columns={customerColumns} data={filtered} keyExtractor={(c) => c.id} />;
      })()}
    </div>
  );
}
