"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Building2, CalendarOff, DollarSign, Bug } from "lucide-react";
import { KPICard, LoadingSpinner, EmptyState, Button, PageHeader } from "@erp/ui";
import { useAuthStore, useCurrentUser } from "@erp/shell";
import { api, type EmployeeResponse, type DepartmentResponse, type LeaveRequestResponse, type PayrollRunResponse } from "../lib/api";

const isDev = process.env.NODE_ENV === "development";

export default function HRDashboardPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useCurrentUser();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, depts, leave, payroll] = await Promise.all([
        api.employees.list(),
        api.departments.list(),
        api.leave.list(),
        api.payroll.list(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setLeaveRequests(leave);
      setPayrollRuns(payroll);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Error loading dashboard" description={error} action={<Button onClick={load}>Retry</Button>} />;

  const activeEmployees = employees.filter((e) => e.status !== "TERMINATED");
  const pendingLeave = leaveRequests.filter((r) => r.status === "PENDING");
  const latestPayroll = payrollRuns.length > 0 ? payrollRuns[0] : null;

  // Department headcount data
  const deptHeadcounts = departments.map((d) => ({
    name: d.name,
    headcount: employees.filter((e) => e.departmentId === d.id && e.status !== "TERMINATED").length,
  })).sort((a, b) => b.headcount - a.headcount);
  const maxHeadcount = Math.max(1, ...deptHeadcounts.map((d) => d.headcount));

  // Upcoming approved leave
  const today = new Date().toISOString().slice(0, 10);
  const upcomingLeave = leaveRequests
    .filter((r) => r.status === "APPROVED" && r.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="HR Dashboard" description="Workforce overview & upcoming events" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Employees" value={String(activeEmployees.length)} icon={<Users className="w-5 h-5" />} />
        <KPICard title="Departments" value={String(departments.length)} icon={<Building2 className="w-5 h-5" />} />
        <KPICard title="Pending Leave" value={String(pendingLeave.length)} icon={<CalendarOff className="w-5 h-5" />} />
        <KPICard
          title="Last Payroll"
          value={latestPayroll ? new Intl.NumberFormat("en-US", { style: "currency", currency: latestPayroll.currency }).format(latestPayroll.totalNet.amount) : "—"}
          subtitle={latestPayroll?.periodLabel}
          icon={<DollarSign className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 dark:bg-gray-800 dark:ring-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Department Headcount</h2>
          {deptHeadcounts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No departments yet</p>
          ) : (
            <div className="space-y-3">
              {deptHeadcounts.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 shrink-0 truncate dark:text-gray-400">{d.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(d.headcount / maxHeadcount) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right dark:text-white">{d.headcount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Leave</h2>
          </div>
          {upcomingLeave.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500 text-center dark:text-gray-400">No upcoming approved leave</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {upcomingLeave.map((l) => (
                <div key={l.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{l.employeeName ?? "Unknown"}</p>
                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{l.leaveType.toLowerCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{l.totalDays} days</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isDev && (
        <div className="rounded-2xl ring-1 ring-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:ring-amber-800">
          <button
            onClick={() => setShowToken((v) => !v)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-amber-700 dark:text-amber-400"
          >
            <Bug className="h-4 w-4" />
            <span>JWT Token (dev only)</span>
            <span className="ml-auto text-xs">{showToken ? "Hide" : "Show"}</span>
          </button>
          {showToken && (
            <div className="space-y-3 border-t border-amber-200 px-4 py-3 dark:border-amber-800">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1">Raw Token</p>
                <pre className="overflow-auto text-xs text-amber-900 dark:text-amber-200 break-all whitespace-pre-wrap max-h-32">
                  {accessToken ?? "No token"}
                </pre>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1">Decoded Payload</p>
                <pre className="overflow-auto text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap max-h-48">
                  {user ? JSON.stringify(user, null, 2) : "Unable to decode"}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
