'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useOrgContext } from '@/context/org';
import { DataTable, StatusBadge, type TableColumn } from '@erp/ui';

interface Team { id: string; name: string; code: string; description?: string; departmentId?: string; status: string }
interface Department { id: string; name: string }

export default function TeamsPage() {
  const router = useRouter();
  const { orgId } = useOrgContext();
  const [items, setItems] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const editingIdRef = useRef<string | null>(null);

  const formSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string().min(1, 'Code is required').max(50, 'Max 50 chars').transform((v) => v.toUpperCase()),
    description: z.string().optional(),
    departmentId: z.string().optional(),
  });
  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', code: '', description: '', departmentId: '' },
  });

  useEffect(() => {
    const init = async () => {
      try {
        if (orgId) {
          const [teamRes, deptRes] = await Promise.all([
            authApi.listTeams(orgId),
            authApi.listDepartments(orgId),
          ]);
          setItems(teamRes.data?.data || []);
          setDepartments(deptRes.data?.data || []);
        }
      } catch {
        setItems([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const onSubmit = async (data: FormData) => {
    if (!orgId) return;
    setSaving(true);
    const body = { ...data, departmentId: data.departmentId || null };
    try {
      if (editingIdRef.current) {
        const res = await authApi.updateTeam(orgId, editingIdRef.current, body);
        setItems(items.map((d) => (d.id === editingIdRef.current ? res.data?.data : d)));
      } else {
        const res = await authApi.createTeam(orgId, body);
        setItems([...items, res.data?.data]);
      }
      resetForm();
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    reset();
    editingIdRef.current = null;
    setShowForm(false);
  };

  const deptName = (deptId?: string) => departments.find((d) => d.id === deptId)?.name || '—';

  const handleDelete = async (id: string) => {
    if (!orgId || !confirm('Delete this team?')) return;
    try {
      await authApi.deleteTeam(orgId, id);
      setItems(items.filter((t) => t.id !== id));
    } catch {
      // handled
    }
  };

  const startEdit = (item: Team) => {
    reset({
      name: item.name,
      code: item.code,
      description: item.description || '',
      departmentId: item.departmentId || '',
    });
    editingIdRef.current = item.id;
    setShowForm(true);
  };

  if (!orgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No organization selected. Go to Organization Settings first.</p>
      </div>
    );
  }

  const teamColumns: TableColumn<Team>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <button onClick={() => router.push('/admin/teams')} className="text-sm font-medium text-blue-600 transition hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
          {item.name}
        </button>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      render: (item) => (
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">{item.code}</span>
      ),
    },
    {
      key: 'departmentId',
      header: 'Department',
      render: (item) => <span className="text-sm text-gray-500 dark:text-gray-400">{deptName(item.departmentId)}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => <span className="max-w-xs truncate text-sm text-gray-500 dark:text-gray-400">{item.description || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (item) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); startEdit(item); }}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Teams" subtitle="Manage teams within departments" />

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                {...register('name')}
                placeholder="React Team"
              />
              {errors.name && <div className="mt-1 text-xs text-red-500">{errors.name.message}</div>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Code</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                {...register('code')}
                placeholder="REACT"
                maxLength={50}
              />
              {errors.code && <div className="mt-1 text-xs text-red-500">{errors.code.message}</div>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                {...register('departmentId')}
              >
                <option value="">— No department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                {...register('description')}
                placeholder="Frontend React development"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || saving}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingIdRef.current ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Team
        </button>
      )}

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : items.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No teams yet</p>
          </div>
        ) : (
          <DataTable<Team>
            columns={teamColumns}
            data={items}
            keyExtractor={(item) => item.id}
          />
        )}
      </div>
    </div>
  );
}
