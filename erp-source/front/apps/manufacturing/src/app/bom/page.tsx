"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { DataTable, LoadingSpinner, EmptyState, PageHeader, StatusBadge, ActionButtons, type ActionButtonItem, type TableColumn } from "@erp/ui";
import { api, type BillOfMaterials } from "../../lib/api";

export default function BOMPage() {
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.bom.list();
      setBoms(res.data);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load bill of materials");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pageActions: ActionButtonItem[] = [
    { key: "create", label: "New BOM", icon: <Plus className="h-3.5 w-3.5" />, variant: "primary", size: "sm", onClick: () => { } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bill of Materials"
        description={`${boms.length} BOMs`}
        actions={<ActionButtons actions={pageActions} />}
      />

      {loading && <LoadingSpinner />}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && !error && (() => {
        const bomColumns: TableColumn<BillOfMaterials>[] = [
          { key: 'productName', header: 'Product', render: (b) => <span className="text-sm font-medium text-gray-900">{b.productName}</span> },
          { key: 'version', header: 'Version', render: (b) => <span className="text-sm text-gray-500">{b.version}</span> },
          { key: 'components', header: 'Components', align: 'center' as const, render: (b) => <span className="text-sm text-gray-700">{b.components.length}</span> },
          {
            key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} />,
          },
        ];
        return boms.length === 0
          ? <EmptyState title="No BOMs" description="No bill of materials created yet." />
          : <DataTable<BillOfMaterials> columns={bomColumns} data={boms} keyExtractor={(b) => b.id} />;
      })()}
    </div>
  );
}
