"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, Plus } from "lucide-react";
import { Modal, Button, Input, Textarea, LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type DepartmentResponse, type EmployeeResponse } from "../../lib/api";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [depts, emps] = await Promise.all([api.departments.list(), api.employees.list()]);
      setDepartments(depts);
      setEmployees(emps);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function headcount(deptId: string) {
    return employees.filter((e) => e.departmentId === deptId && e.status !== "TERMINATED").length;
  }

  function managerName(managerId: string | null) {
    if (!managerId) return "—";
    const m = employees.find((e) => e.id === managerId);
    return m ? `${m.firstName} ${m.lastName}` : "—";
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.departments.create({
        code: fd.get("code"),
        name: fd.get("name"),
        description: fd.get("description") || undefined,
        managerId: fd.get("managerId") || undefined,
      });
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      alert((err as { message?: string }).message ?? "Failed to create department");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error loading departments" description={error} action={<Button onClick={load}>Retry</Button>} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{departments.length} departments</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <EmptyState title="No departments" description="Create your first department" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => {
            const hc = headcount(d.id);
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 hover:shadow-md transition-shadow dark:bg-gray-800 dark:ring-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{d.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Code: {d.code}</p>
                  </div>
                </div>
                {d.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2 dark:text-gray-400">{d.description}</p>}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{hc}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Headcount</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 truncate dark:text-gray-300">{managerName(d.managerId)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Department">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Department Code" name="code" placeholder="e.g. ENG" required />
          <Input label="Department Name" name="name" placeholder="e.g. Engineering" required />
          <Textarea label="Description" name="description" rows={3} />
          <input type="hidden" name="managerId" value="" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Department</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
