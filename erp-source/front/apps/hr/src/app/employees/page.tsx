"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { Modal, Button, Input, Select, LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type EmployeeResponse, type DepartmentResponse, type PositionResponse } from "../../lib/api";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  ON_LEAVE: "bg-yellow-100 text-yellow-800",
  TERMINATED: "bg-red-100 text-red-800",
  PROBATION: "bg-blue-100 text-blue-800",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [positions, setPositions] = useState<PositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, depts, pos] = await Promise.all([
        api.employees.list(),
        api.departments.list(),
        api.positions.list(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setPositions(pos);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    return name.includes(q) || (e.departmentName ?? "").toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.employees.create({
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        email: fd.get("email"),
        phone: fd.get("phone") || undefined,
        dateOfBirth: fd.get("dateOfBirth"),
        hireDate: fd.get("hireDate"),
        departmentId: fd.get("departmentId"),
        positionId: fd.get("positionId"),
        baseSalary: Number(fd.get("baseSalary")),
        currency: fd.get("currency") || "USD",
      });
      setShowCreate(false);
      load();
    } catch (err: unknown) {
      alert((err as { message?: string }).message ?? "Failed to create employee");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error loading employees" description={error} action={<Button onClick={load}>Retry</Button>} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{employees.length} team members</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-900"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No employees found" description={search ? "Try a different search" : "Add your first employee"} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-x-auto max-w-full dark:bg-gray-800 dark:ring-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{emp.departmentName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{emp.positionTitle ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(emp.hireDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[emp.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {emp.status.toLowerCase().replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Employee" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" name="firstName" required />
            <Input label="Last Name" name="lastName" required />
          </div>
          <Input label="Email" name="email" type="email" required />
          <Input label="Phone" name="phone" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" name="dateOfBirth" type="date" required />
            <Input label="Hire Date" name="hireDate" type="date" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              name="departmentId"
              required
              options={[{ value: "", label: "Select department" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
            />
            <Select
              label="Position"
              name="positionId"
              required
              options={[{ value: "", label: "Select position" }, ...positions.map((p) => ({ value: p.id, label: p.title }))]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Salary" name="baseSalary" type="number" step="0.01" required />
            <Select label="Currency" name="currency" options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }]} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Employee</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
