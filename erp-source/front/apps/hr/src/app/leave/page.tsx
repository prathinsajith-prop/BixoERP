"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Button, Input, Select, Textarea, LoadingSpinner, EmptyState } from "@erp/ui";
import { api, type LeaveRequestResponse, type EmployeeResponse } from "../../lib/api";

const submitSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  leaveType: z.string().min(1, "Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
}).refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
  message: "End date must be on or after start date",
  path: ["endDate"],
});
type SubmitFormData = z.infer<typeof submitSchema>;

const rejectSchema = z.object({
  reason: z.string().min(3, "Please provide a rejection reason (min. 3 characters)"),
});
type RejectFormData = z.infer<typeof rejectSchema>;

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [showSubmit, setShowSubmit] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const submitForm = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
  });
  const rejectForm = useForm<RejectFormData>({
    resolver: zodResolver(rejectSchema),
  });

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

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([api.leave.list(), api.employees.list()])
      .then(([reqs, emps]) => {
        if (!ignore) { setRequests(reqs); setEmployees(emps); setError(null); }
      })
      .catch((err: unknown) => {
        if (!ignore) setError((err as { message?: string }).message ?? 'Failed to load leave requests');
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const filtered = tab === "pending" ? requests.filter((r) => r.status === "PENDING") : requests;

  async function handleApprove(id: string) {
    setActionLoading(id);
    setActionError(null);
    try {
      await api.leave.approve(id);
      load();
    } catch (err: unknown) {
      setActionError((err as { message?: string }).message ?? "Failed to approve leave request");
    } finally {
      setActionLoading(null);
    }
  }

  function openRejectModal(id: string) {
    rejectForm.reset();
    setRejectingId(id);
  }

  async function onReject(data: RejectFormData) {
    if (!rejectingId) return;
    setActionError(null);
    try {
      await api.leave.reject(rejectingId, data.reason);
      setRejectingId(null);
      load();
    } catch (err: unknown) {
      setActionError((err as { message?: string }).message ?? "Failed to reject leave request");
    }
  }

  async function onSubmit(data: SubmitFormData) {
    await api.leave.submit({
      employeeId: data.employeeId,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: daysBetween(data.startDate, data.endDate),
      reason: data.reason || undefined,
    });
    setShowSubmit(false);
    submitForm.reset();
    load();
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

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{actionError}</p>
      )}

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
                          onClick={() => openRejectModal(lr.id)}
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

      {/* Submit leave request modal */}
      <Modal open={showSubmit} onClose={() => { setShowSubmit(false); submitForm.reset(); }} title="Submit Leave Request" size="lg">
        <form onSubmit={submitForm.handleSubmit(onSubmit)} className="space-y-4">
          {submitForm.formState.errors.root && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitForm.formState.errors.root.message}</p>
          )}
          <Select
            label="Employee"
            error={submitForm.formState.errors.employeeId?.message}
            options={[
              { value: "", label: "Select employee" },
              ...employees.filter((e) => e.status === "ACTIVE").map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
            ]}
            {...submitForm.register("employeeId")}
          />
          <Select
            label="Leave Type"
            error={submitForm.formState.errors.leaveType?.message}
            options={leaveTypeOptions}
            {...submitForm.register("leaveType")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" error={submitForm.formState.errors.startDate?.message} {...submitForm.register("startDate")} />
            <Input label="End Date" type="date" error={submitForm.formState.errors.endDate?.message} {...submitForm.register("endDate")} />
          </div>
          <Textarea label="Reason" rows={3} placeholder="Optional reason for leave" {...submitForm.register("reason")} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => { setShowSubmit(false); submitForm.reset(); }}>Cancel</Button>
            <Button type="submit" loading={submitForm.formState.isSubmitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Reject leave request modal */}
      <Modal open={rejectingId !== null} onClose={() => setRejectingId(null)} title="Reject Leave Request">
        <form onSubmit={rejectForm.handleSubmit(onReject)} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Please provide a reason for rejecting this leave request.</p>
          <Textarea
            label="Rejection Reason"
            rows={3}
            placeholder="e.g. Insufficient team coverage during this period"
            error={rejectForm.formState.errors.reason?.message}
            {...rejectForm.register("reason")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button type="submit" loading={rejectForm.formState.isSubmitting} className="bg-red-600 hover:bg-red-700">Reject Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
