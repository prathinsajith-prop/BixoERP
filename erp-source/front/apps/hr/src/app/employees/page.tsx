"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Download, Upload, ChevronUp, ChevronDown,
  ChevronsUpDown, Copy, Check, MoreHorizontal, Users,
  UserCheck, Clock, AlertCircle, ChevronRight, X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Modal, Button, Input, Select } from "@erp/ui";
import { showToast } from "@erp/shell";
import { api, type EmployeeResponse, type DepartmentResponse, type PositionResponse } from "../../lib/api";

// Extended employee type (backend returns these extra fields)
type Employee = EmployeeResponse & { employmentType?: string; employeeCode?: string };

// ─── Form Schema ───────────────────────────────────────────────
const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  hireDate: z.string().min(1, "Hire date is required"),
  departmentId: z.string().min(1, "Please select a department"),
  positionId: z.string().min(1, "Please select a position"),
  managerId: z.string().uuid().nullable().optional(),
  baseSalary: z.coerce.number({ invalid_type_error: "Salary must be a number" }).positive("Salary must be greater than 0"),
  currency: z.string().default("USD"),
});
type EmployeeFormData = z.infer<typeof employeeSchema>;

// ─── Constants ──────────────────────────────────────────────────
const TYPE_STYLES: Record<string, string> = {
  full_time: "bg-blue-100 text-blue-800",
  FULL_TIME: "bg-blue-100 text-blue-800",
  part_time: "bg-purple-100 text-purple-800",
  PART_TIME: "bg-purple-100 text-purple-800",
  contract: "bg-amber-100 text-amber-800",
  CONTRACT: "bg-amber-100 text-amber-800",
  intern: "bg-teal-100 text-teal-800",
  INTERN: "bg-teal-100 text-teal-800",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  active: "bg-green-100 text-green-800",
  PROBATION: "bg-amber-100 text-amber-800",
  probation: "bg-amber-100 text-amber-800",
  NOTICE_PERIOD: "bg-orange-100 text-orange-800",
  notice_period: "bg-orange-100 text-orange-800",
  ON_LEAVE: "bg-yellow-100 text-yellow-800",
  TERMINATED: "bg-red-100 text-red-800",
  terminated: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-100 text-gray-600",
  suspended: "bg-gray-100 text-gray-600",
};

// ─── Helpers ────────────────────────────────────────────────────
function formatJoinDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600", "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500", "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500", "from-indigo-500 to-blue-600",
];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Skeleton ───────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden dark:bg-gray-800 dark:ring-gray-700">
      <div className="animate-pulse">
        <div className="bg-gray-50 dark:bg-gray-800/80 px-4 py-3 flex gap-4">
          {[40, 120, 200, 120, 120, 80, 80, 100, 40].map((w, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: w }} />
          ))}
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-4 py-4 flex gap-4 border-t border-gray-100 dark:border-gray-700">
            <div className="h-4 w-8 bg-gray-100 dark:bg-gray-700/50 rounded" />
            <div className="h-4 w-28 bg-gray-100 dark:bg-gray-700/50 rounded font-mono" />
            <div className="flex items-center gap-2" style={{ width: 200 }}>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-40" />
              </div>
            </div>
            {[100, 100, 60, 60, 80].map((w, j) => (
              <div key={j} className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Actions Dropdown ────────────────────────────────────────────
function ActionsMenu({ emp, onDeactivate }: { emp: Employee; onDeactivate: (emp: Employee) => void }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 py-1 text-sm">
            <button onClick={() => { setOpen(false); router.push(`/employees/${emp.id}`); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">View profile</button>
            <button onClick={() => { setOpen(false); router.push(`/employees/${emp.id}?edit=1`); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Edit</button>
            <button onClick={() => { setOpen(false); router.push(`/employees/${emp.id}?tab=status`); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Change status</button>
            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
            <button onClick={() => { setOpen(false); onDeactivate(emp); }} className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Deactivate</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Copy ID Button ──────────────────────────────────────────────
function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button onClick={copy} title="Copy ID" className="group flex items-center gap-1 font-mono text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
      {value}
      {copied ? <Check className="w-3 h-3 text-green-500 shrink-0" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />}
    </button>
  );
}

// ─── Column helper ───────────────────────────────────────────────
const colHelper = createColumnHelper<Employee>();

// ─── Main Page ───────────────────────────────────────────────────
export default function EmployeesPage() {
  const router = useRouter();

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [positions, setPositions] = useState<PositionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJoinFrom, setFilterJoinFrom] = useState("");
  const [filterJoinTo, setFilterJoinTo] = useState("");

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);

  // Modal
  const [showCreate, setShowCreate] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { currency: "USD" },
  });

  // ─── Load ──────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, depts, pos] = await Promise.all([api.employees.list(), api.departments.list(), api.positions.list()]);
      setEmployees(emps as Employee[]);
      setDepartments(depts);
      setPositions(pos);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([api.employees.list(), api.departments.list(), api.positions.list()])
      .then(([emps, depts, pos]) => {
        if (!ignore) { setEmployees(emps as Employee[]); setDepartments(depts); setPositions(pos); setError(null); }
      })
      .catch((err: unknown) => {
        if (!ignore) setError((err as { message?: string }).message ?? "Failed to load employees");
      })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  // ─── Filtered data ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      if (q) {
        const name = `${e.firstName} ${e.lastName}`.toLowerCase();
        const code = (e.employeeCode ?? "").toLowerCase();
        const email = e.email.toLowerCase();
        if (!name.includes(q) && !code.includes(q) && !email.includes(q)) return false;
      }
      if (filterDept && e.departmentId !== filterDept) return false;
      if (filterType && (e.employmentType ?? "").toLowerCase() !== filterType.toLowerCase()) return false;
      if (filterStatus && e.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (filterJoinFrom && e.hireDate < filterJoinFrom) return false;
      if (filterJoinTo && e.hireDate > filterJoinTo) return false;
      return true;
    });
  }, [employees, search, filterDept, filterType, filterStatus, filterJoinFrom, filterJoinTo]);

  const hasFilters = !!(search || filterDept || filterType || filterStatus || filterJoinFrom || filterJoinTo);

  const clearFilters = () => {
    setSearch(""); setFilterDept(""); setFilterType(""); setFilterStatus(""); setFilterJoinFrom(""); setFilterJoinTo("");
    setPageIndex(0);
  };

  // ─── Stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "ACTIVE").length;
    const probation = employees.filter((e) => ["PROBATION", "probation"].includes(e.status)).length;
    const notice = employees.filter((e) => ["NOTICE_PERIOD", "notice_period"].includes(e.status)).length;
    return { total, active, probation, notice };
  }, [employees]);

  const deptCount = useMemo(() => new Set(employees.map((e) => e.departmentId).filter(Boolean)).size, [employees]);

  // ─── Deactivate ────────────────────────────────────────────────
  const handleDeactivate = useCallback(async (emp: Employee) => {
    if (!confirm(`Deactivate ${emp.firstName} ${emp.lastName}? They will lose system access.`)) return;
    try {
      await api.employees.update(emp.id, { status: "TERMINATED" });
      const name = `${emp.firstName} ${emp.lastName}`;
      showToast.warning("Employee deactivated", `${name} no longer has system access.`);
      load();
    } catch (err: unknown) {
      showToast.error("Something went wrong", (err as { message?: string }).message ?? "Failed to deactivate employee");
    }
  }, [load]);

  // ─── Create modal ──────────────────────────────────────────────
  function closeModal() { setShowCreate(false); reset(); }

  async function onSubmit(data: EmployeeFormData) {
    try {
      const emp = await api.employees.create(data);
      const name = `${data.firstName} ${data.lastName}`;
      const code = (emp as Employee).employeeCode ?? "";
      showToast.success("Employee added", code ? `${name} (${code}) has been added.` : `${name} has been added.`);
      closeModal();
      load();
    } catch (err: unknown) {
      showToast.error("Something went wrong", (err as { message?: string }).message ?? "Failed to create employee");
    }
  }

  // ─── Columns ───────────────────────────────────────────────────
  const columns = useMemo(() => [
    colHelper.display({
      id: "select",
      size: 40,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => { if (el) el.indeterminate = table.getIsSomePageRowsSelected(); }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
        />
      ),
    }),
    colHelper.display({
      id: "rowNum",
      size: 40,
      header: "#",
      cell: ({ row, table }) => (
        <span className="text-gray-400 tabular-nums text-xs">
          {table.getSortedRowModel().rows.indexOf(row) + 1 + pageIndex * pageSize}
        </span>
      ),
    }),
    colHelper.accessor("employeeCode", {
      id: "employeeCode",
      header: "Employee ID",
      size: 140,
      cell: ({ row }) => {
        const code = row.original.employeeCode ?? "—";
        return code !== "—" ? <CopyableId value={code} /> : <span className="text-gray-400 font-mono text-xs">—</span>;
      },
    }),
    colHelper.accessor("firstName", {
      id: "name",
      header: "Name",
      size: 220,
      cell: ({ row }) => {
        const emp = row.original;
        const initials = getInitials(emp.firstName, emp.lastName);
        const grad = avatarColor(emp.id);
        return (
          <div className="flex items-center gap-2.5 min-w-[200px]">
            <div className={`h-8 w-8 shrink-0 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-xs font-bold text-white`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{emp.email}</p>
            </div>
          </div>
        );
      },
      sortingFn: (a, b) => {
        const na = `${a.original.firstName} ${a.original.lastName}`;
        const nb = `${b.original.firstName} ${b.original.lastName}`;
        return na.localeCompare(nb);
      },
    }),
    colHelper.accessor("departmentName", {
      header: "Department",
      size: 130,
      cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() ?? "—"}</span>,
    }),
    colHelper.accessor("positionTitle", {
      header: "Job Title",
      size: 130,
      cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() ?? "—"}</span>,
    }),
    colHelper.accessor("employmentType", {
      header: "Type",
      size: 100,
      enableSorting: false,
      cell: ({ getValue }) => {
        const t = getValue() ?? "";
        if (!t) return <span className="text-gray-400 text-xs">—</span>;
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[t] ?? "bg-gray-100 text-gray-600"}`}>
            {t.replace(/_/g, " ").toLowerCase()}
          </span>
        );
      },
    }),
    colHelper.accessor("status", {
      header: "Status",
      size: 110,
      enableSorting: false,
      cell: ({ getValue }) => {
        const s = getValue();
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[s] ?? "bg-gray-100 text-gray-600"}`}>
            {s.replace(/_/g, " ").toLowerCase()}
          </span>
        );
      },
    }),
    colHelper.accessor("hireDate", {
      header: "Join Date",
      size: 110,
      cell: (info) => <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{formatJoinDate(info.getValue())}</span>,
    }),
    colHelper.display({
      id: "actions",
      size: 48,
      header: "",
      cell: ({ row }) => <ActionsMenu emp={row.original} onDeactivate={handleDeactivate} />,
    }),
  ], [pageIndex, pageSize, handleDeactivate]);

  // ─── Table ─────────────────────────────────────────────────────
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex, pageSize });
        setPageIndex(next.pageIndex);
        setPageSize(next.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    enableRowSelection: true,
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const { rows: pageRows } = table.getPaginationRowModel();
  const totalFiltered = filtered.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalFiltered);

  // ─── Sort Icon ─────────────────────────────────────────────────
  function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
    if (isSorted === "asc") return <ChevronUp className="w-3.5 h-3.5 ml-1 text-blue-500" />;
    if (isSorted === "desc") return <ChevronDown className="w-3.5 h-3.5 ml-1 text-blue-500" />;
    return <ChevronsUpDown className="w-3.5 h-3.5 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
  }

  // ─── Render ────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {loading
              ? "Loading…"
              : `${employees.length} employee${employees.length !== 1 ? "s" : ""} across ${deptCount} department${deptCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => showToast.success("Coming soon", "CSV import is not yet available.")}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => showToast.success("Coming soon", "Export is not yet available.")}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total headcount", value: stats.total, icon: <Users className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" },
          { label: "Active", value: stats.active, icon: <UserCheck className="w-5 h-5" />, color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400" },
          { label: "On probation", value: stats.probation, icon: <Clock className="w-5 h-5" />, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" },
          { label: "On notice period", value: stats.notice, icon: <AlertCircle className="w-5 h-5" />, color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3 flex items-center gap-3">
            <div className={`flex-shrink-0 p-2 rounded-lg ${color}`}>{icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {loading ? <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /> : value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filter Row ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative" style={{ width: 280 }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }}
            placeholder="Search by name, ID, email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-900 outline-none"
          />
        </div>

        <select
          value={filterDept}
          onChange={(e) => { setFilterDept(e.target.value); setPageIndex(0); }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
        >
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPageIndex(0); }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
        >
          <option value="">All types</option>
          <option value="full_time">Full time</option>
          <option value="part_time">Part time</option>
          <option value="contract">Contract</option>
          <option value="intern">Intern</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPageIndex(0); }}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-8 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="NOTICE_PERIOD">Notice period</option>
          <option value="TERMINATED">Terminated</option>
        </select>

        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="hidden sm:inline">Joined:</span>
          <input type="date" value={filterJoinFrom} onChange={(e) => { setFilterJoinFrom(e.target.value); setPageIndex(0); }} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none" />
          <span>–</span>
          <input type="date" value={filterJoinTo} onChange={(e) => { setFilterJoinTo(e.target.value); setPageIndex(0); }} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-2 px-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none" />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline ml-1">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* ─── Bulk Action Bar ─── */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl shadow-2xl px-5 py-3 text-sm font-medium">
          <span>{selectedRows.length} employee{selectedRows.length !== 1 ? "s" : ""} selected</span>
          <Button variant="outline" size="sm" onClick={() => showToast.success("Coming soon", "Bulk export is not yet available.")} className="border-gray-600 dark:border-gray-300 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">
            Export selected
          </Button>
          <Button variant="outline" size="sm" onClick={() => showToast.success("Coming soon", "Bulk department change is not yet available.")} className="border-gray-600 dark:border-gray-300 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100">
            Change department
          </Button>
          <Button size="sm" onClick={() => showToast.success("Coming soon", "Bulk deactivation is not yet available.")} className="bg-red-600 hover:bg-red-700 text-white border-0">
            Deactivate selected
          </Button>
          <button onClick={() => setRowSelection({})} className="ml-1 text-gray-400 dark:text-gray-500 hover:text-gray-200 dark:hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Desktop Table ─── */}
      <div className="hidden md:block">
        {loading ? (
          <TableSkeleton />
        ) : totalFiltered === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 flex flex-col items-center justify-center py-20 space-y-3">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No employees found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/80">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center group ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && <SortIcon isSorted={header.column.getIsSorted()} />}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pageRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/employees/${row.original.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
                Showing {start}–{end} of {totalFiltered} employee{totalFiltered !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPageIndex(0); }}
                  className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 pl-2 pr-6 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  {[25, 50, 100].map((s) => <option key={s} value={s}>{s} per page</option>)}
                </select>
                <button onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={pageIndex === 0} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                  {pageIndex + 1} / {table.getPageCount() || 1}
                </span>
                <button onClick={() => setPageIndex((p) => Math.min(p + 1, table.getPageCount() - 1))} disabled={pageIndex >= table.getPageCount() - 1} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Mobile Card List ─── */}
      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : totalFiltered === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No employees found</p>
            {hasFilters && <button onClick={clearFilters} className="text-sm text-blue-600 dark:text-blue-400 mt-1 hover:underline">Clear filters</button>}
          </div>
        ) : (
          filtered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map((emp) => (
            <div
              key={emp.id}
              onClick={() => router.push(`/employees/${emp.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
            >
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarColor(emp.id)} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {getInitials(emp.firstName, emp.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{emp.employeeCode ?? "—"}</p>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[emp.status] ?? "bg-gray-100 text-gray-600"}`}>
                {emp.status.replace(/_/g, " ").toLowerCase()}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* ─── Add Employee Modal ─── */}
      <Modal open={showCreate} onClose={closeModal} title="Add New Employee" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" error={errors.firstName?.message} {...register("firstName")} />
            <Input label="Last Name" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Phone" {...register("phone")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
            <Input label="Hire Date" type="date" error={errors.hireDate?.message} {...register("hireDate")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              error={errors.departmentId?.message}
              options={[{ value: "", label: "Select department" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
              {...register("departmentId")}
            />
            <Select
              label="Position"
              error={errors.positionId?.message}
              options={[{ value: "", label: "Select position" }, ...positions.map((p) => ({ value: p.id, label: p.title }))]}
              {...register("positionId")}
            />
          </div>
          <Select
            label="Manager (optional)"
            options={[
              { value: "", label: "No manager" },
              ...employees
                .filter((e) => e.status !== "TERMINATED")
                .map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))
            ]}
            {...register("managerId")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Salary" type="number" step="0.01" error={errors.baseSalary?.message} {...register("baseSalary")} />
            <Select
              label="Currency"
              options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }]}
              {...register("currency")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Create Employee</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
