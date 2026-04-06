"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ActionButtons,
  Button,
  Card,
  Input,
  KPICard,
  ListView,
  Modal,
  Pagination,
  PageHeader,
  SearchFilter,
  Select,
  StatusBadge,
  Table,
  ViewSwitcher,
  type ActiveFilters,
  type FilterConfig,
  type RowAction,
  type TableColumn,
  type ViewMode,
} from "@erp/ui";
import { api, type EmployeeResponse, type DepartmentResponse, type PositionResponse } from "../../lib/api";
import { Building2, Eye, List, Pencil, Plus, RefreshCw, TableProperties, Trash2, UserCheck, UserMinus, Users } from "lucide-react";

/* ─── Single source of mock data ─── */
const MOCK_EMPLOYEES: EmployeeResponse[] = [
  { id: "m1", employeeNumber: "EMP-001", firstName: "Alice",  lastName: "Chen",      email: "alice.chen@erp.com",    phone: null, dateOfBirth: "1990-03-15", hireDate: "2021-01-10", terminationDate: null, departmentId: "d1", departmentName: "Finance",     positionId: "p1", positionTitle: "Sr. Accountant",     managerId: null, status: "ACTIVE",     baseSalary: { amount: 85000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m2", employeeNumber: "EMP-002", firstName: "Bob",    lastName: "Ramírez",   email: "bob.ramirez@erp.com",   phone: null, dateOfBirth: "1988-07-22", hireDate: "2020-06-01", terminationDate: null, departmentId: "d2", departmentName: "HR",          positionId: "p2", positionTitle: "HR Manager",          managerId: null, status: "ACTIVE",     baseSalary: { amount: 72000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m3", employeeNumber: "EMP-003", firstName: "Carol",  lastName: "Santos",    email: "carol.santos@erp.com",  phone: null, dateOfBirth: "1993-11-08", hireDate: "2022-03-14", terminationDate: null, departmentId: "d3", departmentName: "Sales",       positionId: "p3", positionTitle: "Sales Executive",     managerId: null, status: "ACTIVE",     baseSalary: { amount: 65000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m4", employeeNumber: "EMP-004", firstName: "David",  lastName: "Kim",       email: "david.kim@erp.com",     phone: null, dateOfBirth: "1985-02-19", hireDate: "2019-09-23", terminationDate: null, departmentId: "d4", departmentName: "Engineering", positionId: "p4", positionTitle: "Software Engineer",   managerId: null, status: "PROBATION",  baseSalary: { amount: 95000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m5", employeeNumber: "EMP-005", firstName: "Eva",    lastName: "Müller",    email: "eva.muller@erp.com",    phone: null, dateOfBirth: "1991-05-30", hireDate: "2021-11-09", terminationDate: null, departmentId: "d5", departmentName: "Operations",  positionId: "p5", positionTitle: "Ops Analyst",         managerId: null, status: "ON_LEAVE",   baseSalary: { amount: 70000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m6", employeeNumber: "EMP-006", firstName: "Frank",  lastName: "Okafor",    email: "frank.okafor@erp.com",  phone: null, dateOfBirth: "1987-09-14", hireDate: "2023-01-03", terminationDate: null, departmentId: "d6", departmentName: "Marketing",  positionId: "p6", positionTitle: "Marketing Specialist", managerId: null, status: "ACTIVE",     baseSalary: { amount: 68000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m7", employeeNumber: "EMP-007", firstName: "Grace",  lastName: "Patel",     email: "grace.patel@erp.com",   phone: null, dateOfBirth: "1995-08-03", hireDate: "2023-07-17", terminationDate: null, departmentId: "d4", departmentName: "Engineering", positionId: "p7", positionTitle: "Frontend Developer",  managerId: null, status: "ACTIVE",     baseSalary: { amount: 88000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
  { id: "m8", employeeNumber: "EMP-008", firstName: "Henry",  lastName: "Johansson", email: "henry.j@erp.com",       phone: null, dateOfBirth: "1982-12-25", hireDate: "2018-04-02", terminationDate: null, departmentId: "d1", departmentName: "Finance",     positionId: "p8", positionTitle: "CFO",                 managerId: null, status: "ACTIVE",     baseSalary: { amount: 140000, currency: "USD" }, currency: "USD", createdAt: "", updatedAt: "" },
];

const AVATAR_COLOR_CLASSES = [
  "bg-[var(--gogo-primary)]",
  "bg-[var(--gogo-primary-dark)]",
  "bg-[var(--gogo-primary-light)]",
  "bg-sky-500",
  "bg-violet-600",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-pink-500",
];

function avatarColorClass(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLOR_CLASSES[Math.abs(h) % AVATAR_COLOR_CLASSES.length];
}

function EmployeeBadge({ status }: { status: string }) {
  return <StatusBadge status={status.toLowerCase().replace(/_/g, "-")} />;
}

/* ─── Form schema ─── */
const employeeSchema = z.object({
  firstName:    z.string().min(1, "First name is required"),
  lastName:     z.string().min(1, "Last name is required"),
  email:        z.string().email("Enter a valid email address"),
  phone:        z.string().optional(),
  dateOfBirth:  z.string().min(1, "Date of birth is required"),
  hireDate:     z.string().min(1, "Hire date is required"),
  departmentId: z.string().min(1, "Please select a department"),
  positionId:   z.string().min(1, "Please select a position"),
  baseSalary:   z.coerce.number({ invalid_type_error: "Salary must be a number" }).positive("Salary must be greater than 0"),
  currency:     z.string().default("USD"),
});
type EmployeeFormData = z.infer<typeof employeeSchema>;

/* ═══════════════════════════════════════════════════════════
   Page component
   ═══════════════════════════════════════════════════════════ */
export default function EmployeesPage() {
  /* ─── Data ─── */
  const [employees, setEmployees]   = useState<EmployeeResponse[]>(MOCK_EMPLOYEES);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [positions, setPositions]   = useState<PositionResponse[]>([]);
  const [apiLoaded, setApiLoaded]   = useState(false);
  const [apiError, setApiError]     = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ─── UI state ─── */
  const [search, setSearch]               = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [view, setView]                   = useState<ViewMode>("table");
  const [showCreate, setShowCreate]       = useState(false);
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(10);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { currency: "USD" },
  });

  /* ─── Load API data in background ─── */
  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [emps, depts, pos] = await Promise.all([
        api.employees.list(),
        api.departments.list(),
        api.positions.list(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setPositions(pos);
      setApiError(null);
      setApiLoaded(true);
    } catch (err: unknown) {
      setApiError((err as { message?: string }).message ?? "Could not load live data");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ─── KPI stats computed from data source ─── */
  const stats = useMemo(() => {
    const total  = employees.length;
    const active = employees.filter((e) => e.status === "ACTIVE").length;
    const onLeave = employees.filter((e) => e.status === "ON_LEAVE").length;
    const depts  = new Set(employees.map((e) => e.departmentId)).size;
    return { total, active, onLeave, depts };
  }, [employees]);

  /* ─── Filter config (dept options from API or mock fallback) ─── */
  const filterConfigs: FilterConfig[] = useMemo(() => {
    const deptOptions = departments.length > 0
      ? departments.map((d) => ({ value: d.id, label: d.name }))
      : [...new Set(MOCK_EMPLOYEES.map((e) => e.departmentName ?? ""))].map((d) => ({ value: d, label: d }));
    return [
      {
        key: "status", label: "Status", type: "multiselect" as const,
        options: [
          { value: "ACTIVE", label: "Active" }, { value: "ON_LEAVE", label: "On Leave" },
          { value: "PROBATION", label: "Probation" }, { value: "TERMINATED", label: "Terminated" },
        ],
        quickOptions: [{ value: "ACTIVE", label: "Active only" }, { value: "ON_LEAVE", label: "On Leave" }],
      },
      { key: "department", label: "Department", type: "multiselect" as const, options: deptOptions },
    ];
  }, [departments]);

  /* ─── Derived: filtered + paginated ─── */
  const filtered = useMemo(() => {
    const q            = search.toLowerCase();
    const statusFilter = (activeFilters.status ?? []) as string[];
    const deptFilter   = (activeFilters.department ?? []) as string[];
    return employees.filter((e) => {
      if (q) {
        const name = `${e.firstName} ${e.lastName}`.toLowerCase();
        if (!name.includes(q) && !e.email.toLowerCase().includes(q) && !(e.departmentName ?? "").toLowerCase().includes(q))
          return false;
      }
      if (statusFilter.length > 0 && !statusFilter.includes(e.status)) return false;
      if (deptFilter.length > 0 && !deptFilter.includes(e.departmentId) && !deptFilter.includes(e.departmentName ?? ""))
        return false;
      return true;
    });
  }, [employees, search, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [search, activeFilters, pageSize]);

  /* ─── Handlers ─── */
  const handleFilterChange  = (key: string, value: string | string[]) =>
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  const handleFilterClear   = (key: string) =>
    setActiveFilters((prev) => { const n = { ...prev }; delete n[key]; return n; });
  const handleFilterClearAll = () => setActiveFilters({});

  function closeModal() { setShowCreate(false); setServerError(null); reset(); }
  async function onSubmit(data: EmployeeFormData) {
    setServerError(null);
    try { await api.employees.create(data); closeModal(); load(); }
    catch (err: unknown) { setServerError((err as { message?: string }).message ?? "Failed to create employee"); }
  }

  /* ─── Table columns ─── */
  const columns: TableColumn<EmployeeResponse>[] = [
    {
      key: "name", header: "Employee", sortable: true,
      render: (emp: EmployeeResponse) => (
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColorClass(`${emp.firstName}${emp.lastName}`)}`}>
            {emp.firstName[0]}{emp.lastName[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--gogo-text-primary)]">{emp.firstName} {emp.lastName}</p>
            <p className="text-xs text-[var(--gogo-text-secondary)]">{emp.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "departmentName", header: "Department", sortable: true,
      render: (e: EmployeeResponse) => <span className="text-sm">{e.departmentName ?? "—"}</span>,
    },
    {
      key: "positionTitle", header: "Position",
      render: (e: EmployeeResponse) => <span className="text-sm">{e.positionTitle ?? "—"}</span>,
    },
    {
      key: "hireDate", header: "Joined", sortable: true,
      render: (e: EmployeeResponse) => (
        <span className="text-sm">{new Date(e.hireDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
      ),
    },
    {
      key: "status", header: "Status", sortable: true,
      render: (e: EmployeeResponse) => <EmployeeBadge status={e.status} />,
    },
  ];

  const rowActions: RowAction<EmployeeResponse>[] = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      onClick: (emp) => console.log("view", emp.id),
    },
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (emp) => console.log("edit", emp.id),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (emp) => console.log("delete", emp.id),
      danger: true,
    },
  ];

  const listColumns: TableColumn<EmployeeResponse>[] = [
    {
      key: "departmentName",
      header: "Department",
      render: (employee: EmployeeResponse) => employee.departmentName ?? "—",
    },
    {
      key: "positionTitle",
      header: "Position",
      render: (employee: EmployeeResponse) => employee.positionTitle ?? "—",
    },
    {
      key: "hireDate",
      header: "Joined",
      render: (employee: EmployeeResponse) => new Date(employee.hireDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
    },
    {
      key: "status",
      header: "Status",
      render: (employee: EmployeeResponse) => <EmployeeBadge status={employee.status} />,
    },
  ];

  const viewOptions = useMemo(
    () => [
      { value: "table" as ViewMode, label: "Table view", icon: <TableProperties className="h-4 w-4" /> },
      { value: "list" as ViewMode, label: "List view", icon: <List className="h-4 w-4" /> },
    ],
    []
  );

  /* ─── Toolbar action buttons ─── */
  const toolbarActions = (
    <div className="flex items-center gap-2">
      <ViewSwitcher view={view} onViewChange={setView} options={viewOptions} />
      <ActionButtons
        actions={[
          {
            key: "refresh-employees",
            label: "Refresh",
            icon: <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />,
            variant: "outline",
            loading: refreshing,
            onClick: () => load(true),
          },
          {
            key: "create-employee",
            label: "Create",
            icon: <Plus className="h-3.5 w-3.5" />,
            onClick: () => setShowCreate(true),
          },
        ]}
      />
    </div>
  );

  /* ─── Render ─── */
  return (
    <div className="space-y-6">

      {/* ── Page header with breadcrumb ── */}
      <PageHeader
        title="Employee List"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Human Resource", href: "/hr" },
          { label: "Employee List" },
        ]}
      />

      {/* ── KPI summary cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard
          title="Total Employees"
          value={String(stats.total)}
          trend="flat"
          change={0}
          subtitle="all time"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Active"
          value={String(stats.active)}
          trend="up"
          change={+(((stats.active / Math.max(stats.total, 1)) * 100).toFixed(1))}
          subtitle="of total"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <KPICard
          title="On Leave"
          value={String(stats.onLeave)}
          trend={stats.onLeave > 0 ? "down" : "flat"}
          change={0}
          subtitle="currently"
          icon={<UserMinus className="h-5 w-5" />}
        />
        <KPICard
          title="Departments"
          value={String(stats.depts)}
          trend="flat"
          subtitle="active"
          icon={<Building2 className="h-5 w-5" />}
        />
      </div>

      {/* ── API error banner ── */}
      {apiError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <span>Showing preview data — {apiError}.</span>
          <button onClick={() => load()} className="ml-auto font-medium underline">Retry</button>
        </div>
      )}

      {/* ── Search + Filters + Actions toolbar ── */}
      <SearchFilter
        searchPlaceholder="Search employees…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onFilterClear={handleFilterClear}
        onFilterClearAll={handleFilterClearAll}
        actions={toolbarActions}
      />

      {/* ── Result count ── */}
      {(search || Object.keys(activeFilters).length > 0) && (
        <p className="text-xs text-[var(--gogo-text-secondary)]">
          Showing <strong>{filtered.length}</strong> result{filtered.length !== 1 ? "s" : ""}
          {!apiLoaded && <span className="ml-2 opacity-60">(preview data)</span>}
        </p>
      )}

      {/* ── Table view ── */}
      {view === "table" && (
        <Card padding={false} className="overflow-hidden">
          <Table
            columns={columns}
            data={paginated}
            keyExtractor={(e) => e.id}
            rowActions={rowActions}
            emptyMessage={search || Object.keys(activeFilters).length > 0 ? "No employees match your filters" : "No employees yet"}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        paginated.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--gogo-text-secondary)]">
            {search || Object.keys(activeFilters).length > 0 ? "No employees match your filters" : "No employees yet"}
          </div>
        ) : (
          <div className="space-y-4">
            <ListView
              columns={listColumns}
              data={paginated}
              keyExtractor={(employee) => employee.id}
              title={(employee) => `${employee.firstName} ${employee.lastName}`}
              subtitle={(employee) => employee.positionTitle ?? employee.email}
              leading={(employee) => (
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColorClass(`${employee.firstName}${employee.lastName}`)}`}>
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
              )}
              trailing={(employee) => (
                <div className="flex items-center gap-1">
                  {rowActions.map((action) => (
                    <button
                      key={`${employee.id}-${action.label}`}
                      type="button"
                      onClick={() => action.onClick(employee)}
                      className={`rounded-lg p-1.5 transition hover:bg-[var(--gogo-grey-100)] ${action.danger ? 'text-red-500' : 'text-[var(--gogo-text-secondary)]'}`}
                      title={action.label}
                    >
                      {action.icon ?? <span className="text-xs">{action.label}</span>}
                    </button>
                  ))}
                </div>
              )}
              emptyMessage={search || Object.keys(activeFilters).length > 0 ? "No employees match your filters" : "No employees yet"}
            />
            <Card padding={false} className="overflow-hidden">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </Card>
          </div>
        )
      )}

      {/* ── Add Employee Modal ── */}
      <Modal open={showCreate} onClose={closeModal} title="Add New Employee" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}
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
