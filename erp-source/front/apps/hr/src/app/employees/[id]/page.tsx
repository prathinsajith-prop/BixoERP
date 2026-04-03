"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft, Copy, Check, Pencil, X, Save,
    Mail, Phone, Calendar, Building2, Briefcase, Users,
    DollarSign, Clock, FileText, ChevronRight,
} from "lucide-react";
import { Button, LoadingSpinner } from "@erp/ui";
import { showToast } from "@erp/shell";
import {
    api,
    type EmployeeResponse,
    type LeaveRequestResponse,
    type LeaveBalance,
} from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "documents" | "leave" | "attendance" | "performance" | "timeline";

const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "documents", label: "Documents" },
    { key: "leave", label: "Leave History" },
    { key: "attendance", label: "Attendance" },
    { key: "performance", label: "Performance" },
    { key: "timeline", label: "Timeline" },
];

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    TERMINATED: "bg-red-100 text-red-800",
    ON_LEAVE: "bg-amber-100 text-amber-800",
    PROBATION: "bg-blue-100 text-blue-800",
};

const LEAVE_STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
};

function initials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function daysSince(dateStr: string): number {
    const d = new Date(dateStr);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function fmt(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ─── Inline-editable field ────────────────────────────────────────────────────

interface EditableFieldProps {
    label: string;
    value: string | null | undefined;
    icon?: React.ReactNode;
    fieldKey: string;
    onSave: (key: string, value: string | null) => Promise<void>;
    nullable?: boolean;
}

function EditableField({ label, value, icon, fieldKey, onSave, nullable }: EditableFieldProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? "");
    const [saving, setSaving] = useState(false);

    const startEdit = () => { setDraft(value ?? ""); setEditing(true); };
    const cancel = () => setEditing(false);

    const save = async () => {
        setSaving(true);
        try {
            await onSave(fieldKey, nullable && draft === "" ? null : draft || null);
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 group">
            <div className="mt-0.5 text-gray-400 dark:text-gray-500 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
                {editing ? (
                    <div className="flex items-center gap-2">
                        <input
                            className="flex-1 text-sm rounded border border-gray-300 dark:border-gray-600 px-2 py-1
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
                        />
                        <button onClick={save} disabled={saving}
                            className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50">
                            {saving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button onClick={cancel}
                            className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-900 dark:text-gray-100 break-all">
                            {value ?? <span className="text-gray-400">Not set</span>}
                        </span>
                        <button onClick={startEdit}
                            className="ml-1 p-0.5 rounded text-gray-300 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil size={12} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── CopyBadge ────────────────────────────────────────────────────────────────

function CopyBadge({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={copy}
            className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded
        bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300
        hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            {text}
            {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
        </button>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

interface OverviewProps {
    emp: EmployeeResponse;
    leaveBalance: LeaveBalance | null;
    leaveRequests: LeaveRequestResponse[];
    onFieldSave: (key: string, value: string | null) => Promise<void>;
}

function OverviewTab({ emp, leaveBalance, leaveRequests, onFieldSave }: OverviewProps) {
    const pendingCount = leaveRequests.filter((r) => r.status === "PENDING").length;
    const daysEmployed = daysSince(emp.hireDate);
    const annual = leaveBalance?.balances.find((b) => b.leaveType === "ANNUAL");
    const sick = leaveBalance?.balances.find((b) => b.leaveType === "SICK");

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                    Personal Information
                </h3>
                <EditableField label="Email" value={emp.email} icon={<Mail size={15} />}
                    fieldKey="email" onSave={onFieldSave} />
                <EditableField label="Phone" value={emp.phone} icon={<Phone size={15} />}
                    fieldKey="phone" onSave={onFieldSave} nullable />
                <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="mt-0.5 text-gray-400"><Calendar size={15} /></div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Date of Birth</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{fmt(emp.dateOfBirth)}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="mt-0.5 text-gray-400"><Building2 size={15} /></div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Department</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{emp.departmentName ?? "—"}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="mt-0.5 text-gray-400"><Briefcase size={15} /></div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Position</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{emp.positionTitle ?? "—"}</p>
                    </div>
                </div>
                <EditableField label="Manager ID" value={emp.managerId} icon={<Users size={15} />}
                    fieldKey="managerId" onSave={onFieldSave} nullable />
                <div className="flex items-start gap-3 py-3">
                    <div className="mt-0.5 text-gray-400"><DollarSign size={15} /></div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Base Salary</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                            {emp.baseSalary
                                ? `${emp.baseSalary.currency} ${emp.baseSalary.amount.toLocaleString()}`
                                : "—"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                    Quick Stats
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Days Employed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{daysEmployed.toLocaleString()}</p>
                        </div>
                        <Calendar className="text-gray-300 dark:text-gray-600" size={28} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <div>
                            <p className="text-xs text-amber-600 dark:text-amber-400">Pending Leave Requests</p>
                            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingCount}</p>
                        </div>
                        <Clock className="text-amber-300" size={28} />
                    </div>
                    {annual && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Annual Leave Remaining</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {annual.remaining} <span className="text-sm font-normal">/ {annual.entitled} days</span>
                                </p>
                            </div>
                            <FileText className="text-blue-300" size={28} />
                        </div>
                    )}
                    {sick && (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-400">Sick Leave Remaining</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {sick.remaining} <span className="text-sm font-normal">/ {sick.entitled} days</span>
                                </p>
                            </div>
                            <FileText className="text-green-300" size={28} />
                        </div>
                    )}
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hire Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">{fmt(emp.hireDate)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Leave History Tab ────────────────────────────────────────────────────────

function LeaveHistoryTab({ requests }: { requests: LeaveRequestResponse[] }) {
    if (requests.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>No leave requests yet</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                        {["Type", "Period", "Days", "Status", "Requested On", "Approved By"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {requests.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                {r.leaveType.replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {fmt(r.startDate)} – {fmt(r.endDate)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.totalDays}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEAVE_STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                                    {r.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmt(r.createdAt)}</td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.approvedBy ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Placeholder Tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ label }: { label: string }) {
    return (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <ChevronRight size={20} className="opacity-40" />
            </div>
            <p className="font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xs mt-1">Coming soon</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();

    const initialTab = (searchParams.get("tab") as Tab) ?? "overview";
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [emp, setEmp] = useState<EmployeeResponse | null>(null);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponse[]>([]);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [employee, leaves, balance] = await Promise.allSettled([
                api.employees.get(params.id),
                api.leave.list(),
                api.leave.balance(params.id),
            ]);
            if (employee.status === "rejected") throw new Error("Employee not found");
            setEmp(employee.value);
            if (leaves.status === "fulfilled") {
                setLeaveRequests(leaves.value.filter((r) => r.employeeId === params.id));
            }
            if (balance.status === "fulfilled") setLeaveBalance(balance.value);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Failed to load employee");
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { load(); }, [load]);

    const handleFieldSave = useCallback(async (key: string, value: string | null) => {
        try {
            await api.employees.update(params.id, { [key]: value });
            setEmp((prev) => prev ? { ...prev, [key]: value } : prev);
            showToast.success("Employee updated");
        } catch (e: unknown) {
            const msg = (e as { message?: string })?.message ?? "Update failed";
            showToast.error(msg);
            throw e;
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !emp) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-red-500">{error ?? "Employee not found"}</p>
                <Button variant="outline" onClick={() => router.push("/employees")}>Back to Employees</Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Back */}
            <button
                onClick={() => router.push("/employees")}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
          hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
                <ArrowLeft size={15} />
                Employees
            </button>

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center
            text-primary-700 dark:text-primary-300 font-bold text-xl shrink-0">
                        {initials(emp.firstName, emp.lastName)}
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {emp.firstName} {emp.lastName}
                            </h1>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[emp.status] ?? "bg-gray-100 text-gray-600"}`}>
                                {emp.status}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <CopyBadge text={emp.employeeNumber} />
                            {emp.positionTitle && <span>{emp.positionTitle}</span>}
                            {emp.departmentName && (
                                <>
                                    <span className="opacity-30">·</span>
                                    <span>{emp.departmentName}</span>
                                </>
                            )}
                            <span className="opacity-30">·</span>
                            <span>Joined {fmt(emp.hireDate)}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setActiveTab("overview")}>
                            Edit
                        </Button>
                        {emp.status !== "TERMINATED" && (
                            <Button variant="destructive" size="sm"
                                onClick={() => router.push(`/employees/${emp.id}?tab=status`)}>
                                Terminate
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t.key
                                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab content */}
            <div>
                {activeTab === "overview" && (
                    <OverviewTab emp={emp} leaveBalance={leaveBalance} leaveRequests={leaveRequests} onFieldSave={handleFieldSave} />
                )}
                {activeTab === "leave" && <LeaveHistoryTab requests={leaveRequests} />}
                {activeTab === "documents" && <PlaceholderTab label="Documents" />}
                {activeTab === "attendance" && <PlaceholderTab label="Attendance" />}
                {activeTab === "performance" && <PlaceholderTab label="Performance Reviews" />}
                {activeTab === "timeline" && <PlaceholderTab label="Timeline" />}
            </div>
        </div>
    );
}
