"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Alert, DataTable, Input, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type InventoryItem } from "../../lib/api";

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.items.list();
      setItems(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.includes(search)
  );

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New Item", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Items"
        description={`${items.length} items`}
        actions={<ActionButtons actions={pageActions} />}
      />

      <div className="relative max-w-sm">
        <Input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      {loading && <LoadingSpinner />}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (() => {
        const itemColumns: TableColumn<InventoryItem>[] = [
          { key: 'sku', header: 'SKU', render: (item) => <span className="text-sm font-mono text-gray-700">{item.sku}</span> },
          { key: 'name', header: 'Name', render: (item) => <span className="text-sm font-medium text-gray-900">{item.name}</span> },
          { key: 'categoryName', header: 'Category', render: (item) => <span className="text-sm text-gray-500">{item.categoryName}</span> },
          { key: 'unitOfMeasure', header: 'UOM', render: (item) => <span className="text-sm text-gray-500">{item.unitOfMeasure}</span> },
          {
            key: 'costPrice', header: 'Cost', align: 'right' as const, render: (item) => (
              <span className="text-sm text-gray-900">{item.costPrice.currency} {item.costPrice.amount.toLocaleString()}</span>
            )
          },
          {
            key: 'sellingPrice', header: 'Selling Price', align: 'right' as const, render: (item) => (
              <span className="text-sm text-gray-900">{item.sellingPrice.currency} {item.sellingPrice.amount.toLocaleString()}</span>
            )
          },
          {
            key: 'isActive', header: 'Status', render: (item) => <StatusBadge status={item.isActive ? 'Active' : 'Inactive'} />,
          },
        ];
        return filtered.length === 0
          ? <EmptyState title="No items found" description="Try adjusting your search." />
          : <DataTable<InventoryItem> columns={itemColumns} data={filtered} keyExtractor={(item) => item.id} />;
      })()}
    </div>
  );
}
