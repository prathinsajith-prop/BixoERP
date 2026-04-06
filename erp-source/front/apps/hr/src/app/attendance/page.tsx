"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, Download, ChevronLeft, ChevronRight, Check, X, AlertCircle } from "lucide-react";
import { showToast } from "@erp/shell";
import { api, type AttendanceRecord, type AttendanceStatsResponse, type EmployeeResponse } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "today" | "monthly";

const STATUS_DOT: Record<string, string> = {
    PRESENT: "bg-green-500",
    ABSENT: "bg-red-500",
    LATE: "bg-amber-500",
    HALF_DAY: "bg-amber-300",
    ON_LEAVE: "bg-blue-400",
    HOLIDAY: "bg-gray-400",
    WEEKEND: "bg-gray-300",
};

const STATUS_BADGE: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-800",
    ABSENT: "bg-red-100 text-red-800",
    LATE: "bg-amber-100 text-amber-800",
    HALF_DAY: "bg-amber-50 text-amber-700",
    ON_LEAVE: "bg-blue-100 text-blue-800",
    HOLIDAY: "bg-gray-100 text-gray-600",
    WEEKEND: "bg-gray-50 text-gray-400",
};

function fmtTime(ts: string | null): string {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtMinutes(min: number): string {
    if (min === 0) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({ records, employees, loading }: {
    records: AttendanceRecord[];
    employees: EmployeeResponse[];
    loading: boolean;
}) {
    const empMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p>No attendance records for today</p>
            </div>
        );
    }

    const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "HALF_DAY").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const onLeave = records.filter((r) => r.status === "ON_LEAVE").length;

    return (
        <div className="space-y-5">
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{present}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Present</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{absent}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Absent</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{onLeave}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">On Leave</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            {["Employee", "Status", "Check In", "Check Out", "Working", "Overtime"].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {records.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                    {empMap.get(r.employeeId) ?? r.employeeId.slice(0, 8)}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[r.status] ?? "bg-gray-400"}`} />
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{fmtTime(r.checkInAt)}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">{fmtTime(r.checkOutAt)}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{fmtMinutes(r.workingMinutes)}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{fmtMinutes(r.overtimeMinutes)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── Monthly Tab ──────────────────────────────────────────────────────────────

interface MonthlyProps {
    employees: EmployeeResponse[];
}

function MonthlyTab({ employees }: MonthlyProps) {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [selectedEmployee, setSelectedEmployee] = useState<string>(employees[0]?.id ?? "");
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStatsResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        if (!selectedEmployee) return;
        setLoading(true);
        const from = `${year}-${String(month).padStart(2, "0")}-01`;
        const lastDay = getDaysInMonth(year, month);
        const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        try {
            const [recs, st] = await Promise.all([
                api.attendance.list({ employeeId: selectedEmployee, from, to, limit: 100 }),
                api.attendance.stats(selectedEmployee, year, month),
            ]);
            setRecords(recs.data);
            setStats(st);
        } catch {
            showToast.error("Failed to load attendance");
        } finally {
            setLoading(false);
        }
    }, [selectedEmployee, year, month]);

    useEffect(() => { load(); }, [load]);

    const prevMonth = () => {
        if (month === 1) { setYear((y) => y - 1); setMonth(12); }
        else setMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (month === 12) { setYear((y) => y + 1); setMonth(1); }
        else setMonth((m) => m + 1);
    };

    const recordsByDay = new Map(records.map((r) => [new Date(r.date).getDate(), r]));
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun

    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

    return (
        <div className="space-y-5">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                    ))}
                </select>

                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 text-center">{monthLabel}</span>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Calendar */}
            {loading ? (
                <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-2">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
                        ))}
                    </div>
                    {/* Calendar cells */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`pad-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const rec = recordsByDay.get(day);
                            const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
                            return (
                                <div key={day}
                                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                    ${isToday ? "ring-2 ring-primary-500" : ""}
                    ${rec ? "" : "opacity-40"}`}>
                                    <span className={`text-xs font-medium ${isToday ? "text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-gray-400"}`}>
                                        {day}
                                    </span>
                                    {rec && (
                                        <span className={`mt-0.5 w-2 h-2 rounded-full ${STATUS_DOT[rec.status] ?? "bg-gray-300"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3">
                {[
                    { status: "PRESENT", label: "Present" },
                    { status: "ABSENT", label: "Absent" },
                    { status: "LATE", label: "Late" },
                    { status: "ON_LEAVE", label: "On Leave" },
                    { status: "HOLIDAY", label: "Holiday" },
                    { status: "WEEKEND", label: "Weekend" },
                ].map(({ status, label }) => (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
                        {label}
                    </div>
                ))}
            </div>

            {/* Monthly stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { label: "Present", value: stats.presentDays, color: "text-green-600 dark:text-green-400" },
                        { label: "Absent", value: stats.absentDays, color: "text-red-600 dark:text-red-400" },
                        { label: "Late", value: stats.lateDays, color: "text-amber-600 dark:text-amber-400" },
                        { label: "Working Hours", value: fmtMinutes(stats.totalWorkingMinutes), color: "text-blue-600 dark:text-blue-400" },
                        { label: "Overtime", value: fmtMinutes(stats.totalOvertimeMinutes), color: "text-purple-600 dark:text-purple-400" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
    const [tab, setTab] = useState<Tab>("today");
    const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.attendance.today().catch(() => ({ data: [] as AttendanceRecord[], total: 0, page: 1, limit: 500, totalPages: 1 })),
            api.employees.list().catch(() => [] as EmployeeResponse[]),
        ]).then(([todayRes, emps]) => {
            setTodayRecords(todayRes.data);
            setEmployees(emps);
        }).finally(() => setLoading(false));
    }, []);

    const today = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{today}</p>
                </div>
                <button
                    onClick={() => {
                        const csvData = todayRecords.map((r) =>
                            `${r.employeeId},${r.date},${r.status},${fmtTime(r.checkInAt)},${fmtTime(r.checkOutAt)},${fmtMinutes(r.workingMinutes)}`
                        );
                        const blob = new Blob([["Employee ID,Date,Status,Check In,Check Out,Working\n", ...csvData.map((r) => r + "\n")].join("")], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `attendance-${new Date().toISOString().split("T")[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
            text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800
            hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <Download size={15} />
                    Export CSV
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex gap-1 -mb-px">
                    {([{ key: "today", label: "Today" }, { key: "monthly", label: "Monthly View" }] as { key: Tab; label: string }[]).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key
                                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>

            {tab === "today" && <TodayTab records={todayRecords} employees={employees} loading={loading} />}
            {tab === "monthly" && employees.length > 0 && <MonthlyTab employees={employees} />}
            {tab === "monthly" && employees.length === 0 && !loading && (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                    <p>No employees found. Add employees first.</p>
                </div>
            )}
        </div>
    );
}
