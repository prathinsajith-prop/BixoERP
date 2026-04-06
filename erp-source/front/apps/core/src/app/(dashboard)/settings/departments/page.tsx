'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { useOrgContext } from '@/context/org';
import { showToast } from '@erp/shell';
import CanDo from '@/components/can-do';
import PageHeader from '@/components/page-header';
import Button from '@/components/ui/button';

interface DeptNode {
    id: string;
    name: string;
    type: string;
    depth: number;
    managerId?: string | null;
    children?: DeptNode[];
}

const TYPE_COLOURS: Record<string, string> = {
    DIVISION: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
    DEPARTMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    TEAM: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    UNIT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
function typeBadge(type: string) {
    return TYPE_COLOURS[type?.toUpperCase()] ?? TYPE_COLOURS['UNIT'];
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
interface DeptModalProps {
    orgId: string;
    parentId?: string;
    onClose: () => void;
    onSaved: () => void;
}

function DeptModal({ orgId, parentId, onClose, onSaved }: DeptModalProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('DEPARTMENT');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            await authApi.createDepartment(orgId, { name, type, parentId: parentId ?? null });
            showToast.success('Department created');
            onSaved();
            onClose();
        } catch (err: unknown) {
            showToast.error('Something went wrong', (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to create department');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {parentId ? 'Add sub-department' : 'Add department'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Engineering"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="DIVISION">Division</option>
                            <option value="DEPARTMENT">Department</option>
                            <option value="TEAM">Team</option>
                            <option value="UNIT">Unit</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
                        <Button loading={loading} type="submit">Create</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Tree node renderer ────────────────────────────────────────────────────────
interface TreeNodeProps {
    node: DeptNode;
    orgId: string;
    onAddChild: (parentId: string) => void;
    onDelete: (deptId: string, hasChildren: boolean) => void;
}

function TreeNode({ node, orgId, onAddChild, onDelete }: TreeNodeProps) {
    const [collapsed, setCollapsed] = useState(false);
    const hasChildren = (node.children?.length ?? 0) > 0;

    return (
        <li>
            <div
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                style={{ paddingLeft: `${node.depth * 20 + 8}px` }}
            >
                {/* Expand toggle */}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200 ${!hasChildren ? 'invisible' : ''}`}
                >
                    <svg
                        className={`h-3.5 w-3.5 transition-transform ${collapsed ? '-rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>

                {/* Icon */}
                <svg className="h-4 w-4 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                </svg>

                <span className="flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-100">{node.name}</span>

                <span className={`ml-1 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge(node.type)}`}>
                    {node.type}
                </span>

                {/* Actions — visible on hover */}
                <CanDo resource="department" action="create">
                    <button
                        onClick={() => onAddChild(node.id)}
                        title="Add sub-department"
                        className="hidden rounded p-1 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 group-hover:flex dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </CanDo>
                <CanDo resource="department" action="delete">
                    <button
                        onClick={() => onDelete(node.id, hasChildren)}
                        title="Delete"
                        className="hidden rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 group-hover:flex dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </CanDo>
            </div>

            {!collapsed && hasChildren && (
                <ul>
                    {node.children!.map((child) => (
                        <TreeNode key={child.id} node={child} orgId={orgId} onAddChild={onAddChild} onDelete={onDelete} />
                    ))}
                </ul>
            )}
        </li>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DepartmentsPage() {
    const { orgId } = useOrgContext();
    const [tree, setTree] = useState<DeptNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<{ parentId?: string } | null>(null);

    const load = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const { data } = await authApi.getDepartmentTree(orgId);
            setTree(data.data ?? []);
        } catch {
            // Fall back to flat list if tree endpoint not yet implemented
            try {
                const { data } = await authApi.listDepartments(orgId);
                setTree(data.data ?? []);
            } catch {
                showToast.error('Something went wrong', 'Failed to load departments');
            }
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (deptId: string, hasChildren: boolean) => {
        if (!orgId) return;
        if (hasChildren) {
            alert('Cannot delete a department that has sub-departments. Remove all children first.');
            return;
        }
        if (!confirm('Delete this department?')) return;
        try {
            await authApi.deleteDepartment(orgId, deptId);
            showToast.warning('Department deleted');
            load();
        } catch {
            showToast.error('Something went wrong', 'Failed to delete department');
        }
    };

    return (
        <div className="mx-auto max-w-4xl p-6">
            <PageHeader
                title="Departments"
                subtitle="Organisation hierarchy — divisions, departments, and teams."
                action={
                    <CanDo resource="department" action="create">
                        <Button onClick={() => setModal({})}>
                            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add department
                        </Button>
                    </CanDo>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                </div>
            ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <svg className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No departments yet.</p>
                    <CanDo resource="department" action="create">
                        <button onClick={() => setModal({})} className="mt-3 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                            Create your first department
                        </button>
                    </CanDo>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <ul className="space-y-0.5">
                        {tree.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                orgId={orgId!}
                                onAddChild={(parentId) => setModal({ parentId })}
                                onDelete={handleDelete}
                            />
                        ))}
                    </ul>
                </div>
            )}

            {modal !== null && orgId && (
                <DeptModal
                    orgId={orgId}
                    parentId={modal.parentId}
                    onClose={() => setModal(null)}
                    onSaved={load}
                />
            )}
        </div>
    );
}
