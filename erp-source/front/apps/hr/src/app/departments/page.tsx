"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Textarea, LoadingSpinner, EmptyState } from "@erp/ui";
import { showToast } from "@erp/shell";
import { api, type DepartmentResponse, type EmployeeResponse } from "../../lib/api";

const departmentSchema = z.object({
  code: z.string().min(1, "Department code is required").max(10, "Code must be 10 characters or fewer").toUpperCase(),
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
});
type DepartmentFormData = z.infer<typeof departmentSchema>;

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  });

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

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([api.departments.list(), api.employees.list()])
      .then(([depts, emps]) => {
        if (!ignore) { setDepartments(depts); setEmployees(emps); setError(null); }
      })
      .catch((err: unknown) => {
        if (!ignore) setError((err as { message?: string }).message ?? 'Failed to load departments');
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  function headcount(deptId: string) {
    return employees.filter((e) => e.departmentId === deptId && e.status !== "TERMINATED").length;
  }

  function managerName(managerId: string | null) {
    if (!managerId) return "—";
    const m = employees.find((e) => e.id === managerId);
    return m ? `${m.firstName} ${m.lastName}` : "—";
  }

  function closeModal() {
    setShowCreate(false);
    reset();
  }

  async function onSubmit(data: DepartmentFormData) {
    try {
      await api.departments.create({
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        managerId: undefined,
      });
      showToast.success('Department created');
      closeModal();
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? "Failed to create department";
      showToast.error('Something went wrong', msg);
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

      <Modal open={showCreate} onClose={closeModal} title="Add Department">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Department Code"
            placeholder="e.g. ENG"
            error={errors.code?.message}
            {...register("code")}
          />
          <Input
            label="Department Name"
            placeholder="e.g. Engineering"
            error={errors.name?.message}
            {...register("name")}
          />
          <Textarea label="Description" rows={3} {...register("description")} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Department</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
