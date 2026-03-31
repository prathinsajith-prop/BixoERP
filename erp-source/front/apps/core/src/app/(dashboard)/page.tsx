'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';

function decodeToken(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function StatCard({ label, value, change, changeType, icon, iconBg }: {
  label: string; value: string; change: string; changeType: string; icon: React.ReactNode; iconBg?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md dark:bg-gray-800 dark:ring-gray-700">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg || 'bg-blue-50 text-blue-600'}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${changeType === 'up' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </span>
        <span className="text-xs text-gray-400">vs last month</span>
      </div>
    </div>
  );
}

function ActivityItem({ initials, name, action, time, color }: {
  initials: string; name: string; action: string; time: string; color: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50 dark:hover:bg-white/5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${color}`}>{initials}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 dark:text-gray-100"><span className="font-semibold">{name}</span> {action}</p>
        <p className="mt-0.5 text-xs text-gray-400">{time}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, description, onClick }: {
  icon: React.ReactNode; label: string; description: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left transition hover:border-blue-200 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-gray-700 dark:text-gray-300">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </button>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function RevenueChart() {
  const months = [
    { label: 'Sep', value: 31200 }, { label: 'Oct', value: 38400 }, { label: 'Nov', value: 35100 },
    { label: 'Dec', value: 42800 }, { label: 'Jan', value: 39500 }, { label: 'Feb', value: 44200 }, { label: 'Mar', value: 48295 },
  ];
  const maxVal = Math.max(...months.map((m) => m.value));
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-base font-semibold text-gray-900 dark:text-white">Revenue Overview</h2><p className="text-xs text-gray-500">Last 7 months performance</p></div>
        <div className="text-right"><p className="text-xl font-bold text-gray-900 dark:text-white">$278,495</p><span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">↑ 18.2% overall</span></div>
      </div>
      <div className="flex items-end gap-2 h-36">
        {months.map((m, i) => {
          const pct = (m.value / maxVal) * 100;
          const isLast = i === months.length - 1;
          return (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-gray-500">${(m.value / 1000).toFixed(1)}k</span>
              <div className="relative w-full flex-1 flex items-end justify-center">
                <div className={`w-full max-w-[32px] rounded-t-md transition-all ${isLast ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-800'}`} style={{ height: `${pct}%` }} />
              </div>
              <span className={`text-[10px] font-medium ${isLast ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingEvents() {
  const events = [
    { time: '09:00 AM', title: 'Sprint Planning', tag: 'Meeting', tagColor: 'bg-blue-100 text-blue-700' },
    { time: '11:30 AM', title: 'Client Onboarding — Initech', tag: 'Client', tagColor: 'bg-emerald-100 text-emerald-700' },
    { time: '02:00 PM', title: 'Q1 Financial Review', tag: 'Finance', tagColor: 'bg-violet-100 text-violet-700' },
    { time: '04:00 PM', title: 'Product Demo', tag: 'Sales', tagColor: 'bg-amber-100 text-amber-700' },
    { time: '05:30 PM', title: 'Team Standup', tag: 'Meeting', tagColor: 'bg-blue-100 text-blue-700' },
  ];
  const today = new Date();
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Today&apos;s Schedule</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-white/5">
            <span className="w-16 shrink-0 text-xs font-medium text-gray-400">{e.time}</span>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-600" />
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-900 truncate dark:text-white">{e.title}</p></div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${e.tagColor}`}>{e.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProducts() {
  const products = [
    { name: 'Enterprise Suite', revenue: '$18,420', units: 124, growth: '+15%', growthUp: true },
    { name: 'Cloud Platform', revenue: '$12,850', units: 89, growth: '+22%', growthUp: true },
    { name: 'Analytics Pro', revenue: '$9,340', units: 67, growth: '+8%', growthUp: true },
    { name: 'Support Package', revenue: '$4,680', units: 156, growth: '-3%', growthUp: false },
    { name: 'Developer API', revenue: '$3,005', units: 43, growth: '+31%', growthUp: true },
  ];
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Products</h2>
        <span className="text-xs font-medium text-gray-400">This month</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="pb-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Product</th>
            <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue</th>
            <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Units</th>
            <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Growth</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {products.map((p) => (
              <tr key={p.name}>
                <td className="py-2.5 text-sm font-medium text-gray-900 dark:text-white">{p.name}</td>
                <td className="py-2.5 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{p.revenue}</td>
                <td className="py-2.5 text-right text-sm text-gray-500 hidden sm:table-cell">{p.units}</td>
                <td className="py-2.5 text-right"><span className={`text-xs font-semibold ${p.growthUp ? 'text-emerald-600' : 'text-red-500'}`}>{p.growth}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskList() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review Q1 financial reports', priority: 'High' as const, done: false },
    { id: 2, text: 'Approve vendor contracts', priority: 'High' as const, done: false },
    { id: 3, text: 'Update employee handbook', priority: 'Medium' as const, done: true },
    { id: 4, text: 'Schedule team building event', priority: 'Low' as const, done: false },
    { id: 5, text: 'Prepare board presentation', priority: 'High' as const, done: false },
    { id: 6, text: 'Audit cloud infrastructure costs', priority: 'Medium' as const, done: true },
  ]);
  const toggle = (id: number) => setTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const priorityColor: Record<string, string> = { High: 'text-red-600 bg-red-50', Medium: 'text-amber-600 bg-amber-50', Low: 'text-gray-500 bg-gray-100' };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">My Tasks</h2>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{tasks.filter((t) => !t.done).length} pending</span>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <label key={t.id} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50 cursor-pointer dark:hover:bg-white/5">
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className={`flex-1 text-sm ${t.done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{t.text}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityColor[t.priority]}`}>{t.priority}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function RecentTransactions() {
  const transactions = [
    { id: 'TXN-1042', client: 'Initech Corp', amount: '+$4,250.00', type: 'Payment', date: 'Mar 13', positive: true },
    { id: 'TXN-1041', client: 'Globex Inc', amount: '-$1,200.00', type: 'Refund', date: 'Mar 12', positive: false },
    { id: 'TXN-1040', client: 'Umbrella LLC', amount: '+$8,750.00', type: 'Payment', date: 'Mar 12', positive: true },
    { id: 'TXN-1039', client: 'Waystar Corp', amount: '+$3,100.00', type: 'Payment', date: 'Mar 11', positive: true },
    { id: 'TXN-1038', client: 'Hooli Systems', amount: '+$6,500.00', type: 'Payment', date: 'Mar 11', positive: true },
    { id: 'TXN-1037', client: 'Stark Industries', amount: '-$890.00', type: 'Refund', date: 'Mar 10', positive: false },
  ];
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition">View all</button>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${tx.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {tx.positive ? <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />}
                </svg>
              </div>
              <div><p className="text-sm font-medium text-gray-900 dark:text-white">{tx.client}</p><p className="text-xs text-gray-400">{tx.id} · {tx.date}</p></div>
            </div>
            <div className="text-right"><p className={`text-sm font-semibold ${tx.positive ? 'text-emerald-600' : 'text-red-500'}`}>{tx.amount}</p><p className="text-[10px] text-gray-400">{tx.type}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamOverview() {
  const team = [
    { name: 'Sarah Miller', role: 'Product Lead', status: 'online' as const, tasks: 8, initials: 'SM', color: 'bg-violet-500' },
    { name: 'Raj Kumar', role: 'Sr. Engineer', status: 'online' as const, tasks: 12, initials: 'RK', color: 'bg-amber-500' },
    { name: 'Amy Lee', role: 'Finance Manager', status: 'away' as const, tasks: 5, initials: 'AL', color: 'bg-emerald-500' },
    { name: 'Tom Chen', role: 'Support Lead', status: 'online' as const, tasks: 15, initials: 'TC', color: 'bg-rose-500' },
    { name: 'Lisa Park', role: 'UX Designer', status: 'offline' as const, tasks: 6, initials: 'LP', color: 'bg-cyan-500' },
  ];
  const statusDot: Record<string, string> = { online: 'bg-emerald-500', away: 'bg-amber-400', offline: 'bg-gray-300' };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Team Overview</h2>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{team.filter((t) => t.status === 'online').length} online</span>
      </div>
      <div className="space-y-3">
        {team.map((m) => (
          <div key={m.name} className="flex items-center gap-3">
            <div className="relative">
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${m.color}`}>{m.initials}</span>
              <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusDot[m.status]} dark:border-gray-800`} />
            </div>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-900 truncate dark:text-white">{m.name}</p><p className="text-xs text-gray-400">{m.role}</p></div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{m.tasks} tasks</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const [greeting, setGreeting] = useState('Hello');
  const [currentTime, setCurrentTime] = useState(new Date());

  const user = accessToken ? decodeToken(accessToken) : null;
  const fallbackName = user?.email?.split('@')[0] ?? 'User';
  const [displayName, setDisplayName] = useState(fallbackName);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    authApi.getProfile()
      .then(({ data }: { data: { data?: { user?: { firstName?: string; lastName?: string } } } }) => {
        const u = data.data?.user;
        if (u) {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
          if (fullName) setDisplayName(fullName);
        }
      })
      .catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Revenue', value: '$48,295', change: '12.5%', changeType: 'up', iconBg: 'bg-blue-50 text-blue-600', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Active Users', value: '2,847', change: '8.2%', changeType: 'up', iconBg: 'bg-violet-50 text-violet-600', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
    { label: 'Open Orders', value: '384', change: '3.1%', changeType: 'down', iconBg: 'bg-amber-50 text-amber-600', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg> },
    { label: 'Tasks Due', value: '42', change: '5.7%', changeType: 'up', iconBg: 'bg-emerald-50 text-emerald-600', icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  const activities = [
    { initials: 'JD', name: 'John Doe', action: 'completed invoice #1042', time: '2 minutes ago', color: 'bg-blue-500' },
    { initials: 'SM', name: 'Sarah Miller', action: 'added a new client record', time: '15 minutes ago', color: 'bg-violet-500' },
    { initials: 'RK', name: 'Raj Kumar', action: 'updated inventory for SKU-887', time: '1 hour ago', color: 'bg-amber-500' },
    { initials: 'AL', name: 'Amy Lee', action: 'submitted expense report #309', time: '2 hours ago', color: 'bg-emerald-500' },
    { initials: 'TC', name: 'Tom Chen', action: 'resolved support ticket #2281', time: '3 hours ago', color: 'bg-rose-500' },
  ];

  const departmentData = [
    { label: 'Sales', value: 82, max: 100, color: 'bg-blue-500' },
    { label: 'Marketing', value: 65, max: 100, color: 'bg-violet-500' },
    { label: 'Engineering', value: 94, max: 100, color: 'bg-emerald-500' },
    { label: 'Support', value: 73, max: 100, color: 'bg-amber-500' },
    { label: 'HR', value: 58, max: 100, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Overview of your workspace activity" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map((s) => <StatCard key={s.label} {...s} />)}</div>
      <div className="mb-8 grid gap-6 lg:grid-cols-5"><div className="lg:col-span-3"><RevenueChart /></div><div className="lg:col-span-2"><UpcomingEvents /></div></div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Activity</h2><span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Live</span></div>
          <div className="space-y-1">{activities.map((a, i) => <ActivityItem key={i} {...a} />)}</div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Department Performance</h2>
            <div className="space-y-4">{departmentData.map((d) => (
              <div key={d.label}><div className="mb-1.5 flex items-center justify-between"><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{d.label}</span><span className="text-xs font-semibold text-gray-500">{d.value}%</span></div><MiniBar value={d.value} max={d.max} color={d.color} /></div>
            ))}</div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">System Status</h2>
            <div className="space-y-3">
              {[{ label: 'API Gateway', status: 'Operational' }, { label: 'Database', status: 'Operational' }, { label: 'Auth Service', status: 'Operational' }, { label: 'File Storage', status: 'Maintenance' }].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.status === 'Operational' ? 'text-emerald-600' : 'text-amber-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${s.status === 'Operational' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2"><TaskList /><TopProducts /></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-5"><div className="lg:col-span-3"><RecentTransactions /></div><div className="lg:col-span-2"><TeamOverview /></div></div>
      <div className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>} label="Add User" description="Create a new user account" />
          <QuickAction icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>} label="New Invoice" description="Generate a new invoice" />
          <QuickAction icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>} label="View Reports" description="Access analytics & reports" />
          <QuickAction icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} label="Settings" description="Configure system preferences" onClick={() => router.push('/settings')} />
        </div>
      </div>
    </div>
  );
}
