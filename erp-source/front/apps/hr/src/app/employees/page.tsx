"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Download, Upload, Copy, Check, MoreHorizontal, Users,
  UserCheck, Clock, AlertCircle, ChevronRight, X, Eye, UserX,
  ArrowRightLeft, Table2, LayoutList,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ActionButtons,
  Button,
  DataTable,
  Dropdown,
  Input,
  KPICard,
  ListView,
  Modal,
  Pagination,
  PageHeader,
  SearchFilter,
  Select,
  StatusBadge,
  ViewSwitcher,
  type ActiveFilters,
  type ActionButtonItem,
  type DropdownItem,
  type FilterConfig,
  type SortDirection,
  type TableColumn,
  type ViewMode,
  type ViewOption,
} from "@erp/ui";
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

// ─── Helpers ──────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600", "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500", "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500", "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-purple-500", "from-sky-500 to-blue-500",
];
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
function getInitials(first: string, last: string): string {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "?";
}
function formatJoinDate(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
const TYPE_STYLES: Record<string, string> = {
  full_time: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  part_time: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
  contract: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
  intern: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300",
};
const VIEW_OPTIONS: ViewOption[] = [
  { value: "table", label: "Table view", icon: <Table2 className="h-4 w-4" /> },
  { value: "list", label: "List view", icon: <LayoutList className="h-4 w-4" /> },
];

// ─── CopyableId ───────────────────────────────────────────────
function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button type="button" onClick={copy} title="Copy ID"
      className="inline-flex items-center gap-1 font-mono text-xs transition"
      style={{ color: "var(--gogo-text-secondary)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-primary)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gogo-text-secondary)")}
    >
      {value}
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 opacity-50" />}
    </button>
  );
}

// ─── ActionsMenu ──────────────────────────────────────────────
function ActionsMenu({ emp, onDeactivate }: { emp: Employee; onDeactivate: (e: Employee) => void }) {
  const router = useRouter();
  const items: DropdownItem[] = [
    { key: "view", label: "View profile", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => router.push(`/employees/${emp.id}`) },
    { key: "transfer", label: "Transfer", icon: <ArrowRightLeft className="h-3.5 w-3.5" />, onClick: () => showToast.success("Coming soon", "Transfer is not yet available.") },
    { key: "div", divider: true, label: "" },
    { key: "deactivate", label: "Deactivate", icon: <UserX className="h-3.5 w-3.5" />, danger: true, disabled: emp.status === "TERMINATED", onClick: () => onDeactivate(emp) },
  ];
  return (
    <Dropdown
      trigger={
        <button type="button" onClick={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 transition"
          style={{ color: "var(--gogo-text-secondary)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--gogo-grey-100)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      }
      items={items}
      align="right"
    />
  );
}

// ─── TableSkeleton ────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-3 p-4" style={{ backgroundColor: "var(--gogo-surface)", borderRadius: "var(--radius-card)" }}>
      <div className="h-10 animate-pulse rounded-lg bg-[var(--gogo-grey-100)]" />
      {[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--gogo-grey-100)]" />)}
    </div>
  );
}

/* =================================================================
   Page component
   ================================================================= */
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});

  // Table / view state
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(25);
  const [pageIndex, setPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Modal
  const [showCreate, setShowCreate] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { currency: "USD" },
  });

  // Load
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, depts, pos] = await Promise.all([
        api.employees.list(), api.departments.list(), api.positions.list(),
      ]);
      setEmployees(emps as Employee[]);
      setDepartments(depts);
      setPositions(pos);
      setError(null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message ?? "Could not load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sync activeFilters to individual filter states
  useEffect(() => {
    setFilterDept(String(activeFilters.department ?? ""));
    setFilterStatus(String(activeFilters.status ?? ""));
    setFilterType(String(activeFilters.employmentType ?? ""));
    setFilterJoinFrom(String(activeFilters.joinFrom ?? ""));
    setFilterJoinTo(String(activeFilters.joinTo ?? ""));
    setPageIndex(0);
  }, [activeFilters]);

  // Filtered data
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

  // Sorted data
  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = "", bVal = "";
      if (sortKey === "name")                { aVal = `${a.firstName} ${a.lastName}`; bVal = `${b.firstName} ${b.lastName}`; }
      else if (sortKey === "employeeCode")   { aVal = a.employeeCode ?? ""; bVal = b.employeeCode ?? ""; }
      else if (sortKey === "departmentName") { aVal = a.departmentName ?? ""; bVal = b.departmentName ?? ""; }
      else if (sortKey === "hireDate")       { aVal = a.hireDate ?? ""; bVal = b.hireDate ?? ""; }
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDirection]);

  const totalFiltered = sortedFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const paginatedData = useMemo(
    () => sortedFiltered.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    [sortedFiltered, pageIndex, pageSize],
  );

  const hasFilters = !!(search || filterDept || filterType || filterStatus || filterJoinFrom || filterJoinTo);
  const clearFilters = () => {
    setSearch(""); setActiveFilters({});
    setFilterDept(""); setFilterType(""); setFilterStatus(""); setFilterJoinFrom(""); setFilterJoinTo("");
    setPageIndex(0);
  };

  // Stats
  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => e.status === "ACTIVE").length,
    probation: employees.filter((e) => ["PROBATION", "probation"].includes(e.status)).length,
    notice: employees.filter((e) => ["NOTICE_PERIOD", "notice_period"].includes(e.status)).length,
  }), [employees]);

  const deptCount = useMemo(
    () => new Set(employees.map((e) => e.departmentId).filter(Boolean)).size,
    [employees],
  );

  // Deactivate
  const handleDeactivate = useCallback(async (emp: Employee) => {
    if (!confirm(`Deactivate ${emp.firstName} ${emp.lastName}? They will lose system access.`)) return;
    try {
      await api.employees.update(emp.id, { status: "TERMINATED" });
      showToast.warning("Employee deactivated", `${emp.firstName} ${emp.lastName} no longer has system access.`);
      load();
    } catch (err: unknown) {
      showToast.error("Something went wrong", (err as { message?: string }).message ?? "Failed to deactivate employee");
    }
  }, [load]);

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

  // Page actions
  const pageActions: ActionButtonItem[] = [
    { key: "import", label: "Import CSV",   icon: <Upload className="h-3.5 w-3.5" />,   variant: "outline", size: "sm", onClick: () => showToast.success("Coming soon", "CSV import is not yet available.") },
    { key: "export", label: "Export",       icon: <Download className="h-3.5 w-3.5" />, variant: "outline", size: "sm", onClick: () => showToast.success("Coming soon", "Export is not yet available.") },
    { key: "create", label: "Add Employee", icon: <Plus className="h-3.5 w-3.5" />,     variant: "primary",  size: "sm", onClick: () => setShowCreate(true) },
  ];

  // Filter configs
  const filterConfigs: FilterConfig[] = [
    {
      key: "department", label: "Department", type: "select",
      options: departments.map((d) => ({ value: d.id, label: d.name })),
      placeholder: "All departments",
    },
    {
      key: "status", label: "Status", type: "select",
      options: [
        { value: "ACTIVE", label: "Active" },               { value: "PROBATION",    label: "Probation" },
        { value: "NOTICE_PERIOD", label: "Notice period" }, { value: "TERMINATED",   label: "Terminated" },
      ],
      placeholder: "All statuses",
    },
    {
      key: "employmentType", label: "Type", type: "select",
      options: [
        { value: "full_time", label: "Full time" }, { value: "part_time", label: "Part time" },
        { value: "contract",  label: "Contract" },  { value: "intern",    label: "Intern" },
      ],
      placeholder: "All types",
    },
    { key: "joinFrom", label: "Joined from", type: "date", placeholder: "Start date" },
    { key: "joinTo",   label: "Joined to",   type: "date", placeholder: "End date" },
  ];

  // Table columns
  const tableColumns: TableColumn<Employee>[] = useMemo(() => [
    {
      key: "employeeCode",
      header: "Employee ID",
      sortable: true,
      render: (emp) => emp.employeeCode
        ? <CopyableId value={emp.employeeCode} />
        : <span className="font-mono text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{"—"}</span>,
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-2.5">
          <div className={`h-8 w-8 shrink-0 rounded-full bg-gradient-to-br ${avatarColor(emp.id)} flex items-center justify-center text-xs font-bold text-white`}>
            {getInitials(emp.firstName, emp.lastName)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--gogo-text-primary)" }}>{emp.firstName} {emp.lastName}</p>
            <p className="text-xs truncate" style={{ color: "var(--gogo-text-secondary)" }}>{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "departmentName",
      header: "Department",
      sortable: true,
      render: (emp) => <span className="text-sm" style={{ color: "var(--gogo-text-primary)" }}>{emp.departmentName ?? "—"}</span>,
    },
    {
      key: "positionTitle",
      header: "Job Title",
      render: (emp) => <span className="text-sm" style={{ color: "var(--gogo-text-primary)" }}>{emp.positionTitle ?? "—"}</span>,
    },
    {
      key: "employmentType",
      header: "Type",
      render: (emp) => {
        const t = emp.employmentType ?? "";
        if (!t) return <span className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{"—"}</span>;
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_STYLES[t] ?? "bg-gray-100 text-gray-600"}`}>
            {t.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (emp) => <StatusBadge status={emp.status} label={emp.status.replace(/_/g, " ").toLowerCase()} />,
    },
    {
      key: "hireDate",
      header: "Join Date",
      sortable: true,
      render: (emp) => <span className="text-sm tabular-nums" style={{ color: "var(--gogo-text-secondary)" }}>{formatJoinDate(emp.hireDate)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (emp) => <ActionsMenu emp={emp} onDeactivate={handleDeactivate} />,
    },
  ], [handleDeactivate]);

  // Render
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p style={{ color: "var(--gogo-text-secondary)" }}>{error}</p>
        <Button onClick={load}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        description={loading
          ? "Loading…"
          : `${employees.length} employee${employees.length !== 1 ? "s" : ""} across ${deptCount} department${deptCount !== 1 ? "s" : ""}`
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Total headcount"  value={loading ? "—" : String(stats.total)}     icon={<Users className="h-5 w-5" />} />
        <KPICard title="Active"            value={loading ? "—" : String(stats.active)}    icon={<UserCheck className="h-5 w-5" />} />
        <KPICard title="On probation"      value={loading ? "—" : String(stats.probation)} icon={<Clock className="h-5 w-5" />} />
        <KPICard title="On notice period"  value={loading ? "—" : String(stats.notice)}    icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <SearchFilter
            searchPlaceholder="Search by name, ID or email…"
            searchValue={search}
            onSearchChange={(v) => { setSearch(v); setPageIndex(0); }}
            filters={filterConfigs}
            activeFilters={activeFilters}
            onFilterChange={(key, value) => setActiveFilters((prev) => ({ ...prev, [key]: value }))}
            onFilterClear={(key) => setActiveFilters((prev) => { const next = { ...prev }; delete next[key]; return next; })}
            onFilterClearAll={clearFilters}
            storageKey="hr.employees.searchHistory"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ViewSwitcher view={viewMode} onViewChange={setViewMode} options={VIEW_OPTIONS} />
          <ActionButtons actions={pageActions} />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-2xl shadow-2xl px-5 py-3 text-sm font-medium"
          style={{ backgroundColor: "var(--gogo-text-primary)", color: "var(--gogo-surface)" }}
        >
          <span>{selectedIds.length} employee{selectedIds.length !== 1 ? "s" : ""} selected</span>
          <Button variant="outline" size="sm" onClick={() => showToast.success("Coming soon", "Bulk export is not yet available.")}>Export selected</Button>
          <Button variant="outline" size="sm" onClick={() => showToast.success("Coming soon", "Bulk department transfer is not yet available.")}>Change department</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={() => showToast.success("Coming soon", "Bulk deactivation is not yet available.")}>
            Deactivate selected
          </Button>
          <button onClick={() => setSelectedIds([])} className="ml-1" style={{ color: "var(--gogo-text-secondary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="hidden md:block">
        {loading ? (
          <TableSkeleton />
        ) : totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
            style={{ backgroundColor: "var(--gogo-surface)" }}
          >
            <Users className="w-10 h-10" style={{ color: "var(--gogo-divider)" }} />
            <p className="mt-3 font-medium" style={{ color: "var(--gogo-text-secondary)" }}>No employees found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm" style={{ color: "var(--gogo-primary)" }}>
                Clear filters
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <>
            <DataTable<Employee>
              columns={tableColumns}
              data={paginatedData}
              keyExtractor={(e) => e.id}
              onRowClick={(e) => router.push(`/employees/${e.id}`)}
              selectable
              selectedKeys={selectedIds}
              onSelectionChange={setSelectedIds}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={(key, dir) => { setSortKey(key); setSortDirection(dir); }}
            />
            <Pagination
              page={pageIndex + 1}
              totalPages={totalPages}
              totalItems={totalFiltered}
              pageSize={pageSize}
              pageSizeOptions={[25, 50, 100]}
              onPageChange={(p) => setPageIndex(p - 1)}
              onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            />
          </>
        ) : (
          <>
            <ListView<Employee>
              columns={[
                { key: "departmentName", header: "Department", render: (e) => e.departmentName ?? "—" },
                { key: "positionTitle",  header: "Position",   render: (e) => e.positionTitle ?? "—" },
                { key: "hireDate",       header: "Join Date",  render: (e) => formatJoinDate(e.hireDate) },
                { key: "status",         header: "Status",     render: (e) => <StatusBadge status={e.status} label={e.status.replace(/_/g, " ").toLowerCase()} /> },
              ]}
              data={paginatedData}
              keyExtractor={(e) => e.id}
              title={(e) => `${e.firstName} ${e.lastName}`}
              subtitle={(e) => e.employeeCode ? `${e.employeeCode} · ${e.email}` : e.email}
              leading={(e) => (
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarColor(e.id)} flex items-center justify-center text-sm font-bold text-white`}>
                  {getInitials(e.firstName, e.lastName)}
                </div>
              )}
              trailing={(e) => <ActionsMenu emp={e} onDeactivate={handleDeactivate} />}
              onRowClick={(e) => router.push(`/employees/${e.id}`)}
              emptyMessage="No employees found"
              selectable
              selectedKeys={selectedIds}
              onSelectionChange={setSelectedIds}
            />
            <div className="mt-3">
              <Pagination
                page={pageIndex + 1}
                totalPages={totalPages}
                totalItems={totalFiltered}
                pageSize={pageSize}
                pageSizeOptions={[25, 50, 100]}
                onPageChange={(p) => setPageIndex(p - 1)}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
              />
            </div>
          </>
        )}
      </div>

      <div className="md:hidden space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 animate-pulse flex items-center gap-3"
                style={{ backgroundColor: "var(--gogo-surface)", border: "1px solid var(--gogo-divider)" }}
              >
                <div className="h-10 w-10 rounded-full shrink-0" style={{ backgroundColor: "var(--gogo-grey-100)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 rounded w-2/3" style={{ backgroundColor: "var(--gogo-grey-100)" }} />
                  <div className="h-3 rounded w-1/3" style={{ backgroundColor: "var(--gogo-grey-100)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : totalFiltered === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--gogo-text-secondary)" }}>
            <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No employees found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm mt-1" style={{ color: "var(--gogo-primary)" }}>Clear filters</button>
            )}
          </div>
        ) : (
          paginatedData.map((emp) => (
            <div
              key={emp.id}
              onClick={() => router.push(`/employees/${emp.id}`)}
              className="rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-opacity active:opacity-70"
              style={{ backgroundColor: "var(--gogo-surface)", border: "1px solid var(--gogo-divider)" }}
            >
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarColor(emp.id)} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                {getInitials(emp.firstName, emp.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--gogo-text-primary)" }}>{emp.firstName} {emp.lastName}</p>
                <p className="text-xs font-mono truncate" style={{ color: "var(--gogo-text-secondary)" }}>{emp.employeeCode ?? "—"}</p>
              </div>
              <StatusBadge status={emp.status} label={emp.status.replace(/_/g, " ").toLowerCase()} />
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--gogo-divider)" }} />
            </div>
          ))
        )}
      </div>

      <Modal open={showCreate} onClose={closeModal} title="Add New Employee" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" error={errors.firstName?.message} {...register("firstName")} />
            <Input label="Last Name"  error={errors.lastName?.message}  {...register("lastName")} />
          </div>
          <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          <Input label="Phone" {...register("phone")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
            <Input label="Hire Date"     type="date" error={errors.hireDate?.message}     {...register("hireDate")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" error={errors.departmentId?.message}
              options={[{ value: "", label: "Select department" }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
              {...register("departmentId")} />
            <Select label="Position" error={errors.positionId?.message}
              options={[{ value: "", label: "Select position" }, ...positions.map((p) => ({ value: p.id, label: p.title }))]}
              {...register("positionId")} />
          </div>
          <Select
            label="Manager (optional)"
            options={[
              { value: "", label: "No manager" },
              ...employees.filter((e) => e.status !== "TERMINATED").map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
            ]}
            {...register("managerId")}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Salary" type="number" step="0.01" error={errors.baseSalary?.message} {...register("baseSalary")} />
            <Select label="Currency"
              options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }]}
              {...register("currency")} />
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
