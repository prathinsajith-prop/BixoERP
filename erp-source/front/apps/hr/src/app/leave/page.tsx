"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Modal, Button, Input, Select, Textarea, LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type LeaveRequestResponse, type EmployeeResponse } from "../../lib/api";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const leaveTypeOptions = [
  { value: "", label: "Select type" },
  { value: "ANNUAL", label: "Annual" },
  { value: "SICK", label: "Sick" },
  { value: "MATERNITY", label: "Maternity" },
  { value: "PATERNITY", label: "Paternity" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "BEREAVEMENT", label: "Bereavement" },
  { value: "OTHER", label: "Other" },
];

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequestResponse[]>([]);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [showSubmit, setShowSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [reqs, emps] = await Promise.all([api.leave.list(), api.employees.list()]);
      setRequests(reqs);
      setEmployees(emps);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = tab === "pending" ? requests.filter((r) => r.status === "PENDING") : requests;

  async function handleApprove(id: string) {
    setActionLoading(id);
    try {
      await api.leave.approve(id);
      load();
    } catch (err: unknown) {
      alert((err as { message?: string }).message ?? "Failed to approve");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    setActionLoading(id);
    try {
      await api.leave.reject(id, reason);
      load();
    } catch (err: unknown) {
      alert((err as { message?: string }).message ?? "Failed to reject");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const startDate = fd.get("startDate") as string;
    const endDate = fd.get("endDate") as string;
    setSaving(true);
    try {
      await api.leave.submit({
        employeeId: fd.get("employeeId"),
        leaveType: fd.get("leaveType"),
        startDate,
        endDate,
        totalDays: daysBetween(startDate, endDate),
        reason: fd.get("reason") || undefined,
      });
      setShowSubmit(false);
      load();
    } catch (err: unknown) {
      alert((err as { message?: string }).message ?? "Failed to submit leave request");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error loading leave requests" description={error} action={<Button onClick={load}>Retry</Button>} />;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Requests</h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
            {requests.length} total · {pendingCount} pending
          </p>
        </div>
        <Button onClick={() => setShowSubmit(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Submit Request
        </Button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg ${tab === "all" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"}`}
        >All ({requests.length})</button>
        <button
          onClick={() => setTab("pending")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg ${tab === "pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"}`}
        >Pending ({pendingCount})</button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No leave requests" description={tab === "pending" ? "No pending requests" : "No leave requests yet"} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-x-auto max-w-full dark:bg-gray-800 dark:ring-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((lr) => (
                <tr key={lr.id}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{lr.employeeName ?? "Unknown"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 capitalize dark:text-gray-300">{lr.leaveType.toLowerCase()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(lr.startDate).toLocaleDateString()} → {new Date(lr.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">{lr.totalDays}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyles[lr.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {lr.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {lr.status === "PENDING" && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(lr.id)}
                          disabled={actionLoading === lr.id}
                          className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                        >Approve</button>
                        <button
                          onClick={() => handleReject(lr.id)}
                          disabled={actionLoading === lr.id}
                          className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit Leave Request" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Employee"
            name="employeeId"
            required
            options={[
              { value: "", label: "Select employee" },
              ...employees.filter((e) => e.status === "ACTIVE").map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
            ]}
          />
          <Select label="Leave Type" name="leaveType" required options={leaveTypeOptions} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="startDate" type="date" required />
            <Input label="End Date" name="endDate" type="date" required />
          </div>
          <Textarea label="Reason" name="reason" rows={3} placeholder="Optional reason for leave" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setShowSubmit(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
