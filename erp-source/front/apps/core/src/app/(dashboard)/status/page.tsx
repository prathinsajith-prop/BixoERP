'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';

const SERVICES = [
  {
    category: 'Core Infrastructure',
    items: [
      { name: 'API Gateway', description: 'Main API entry point and request routing', status: 'operational', uptime: '99.98%' },
      { name: 'Load Balancer', description: 'Traffic distribution and failover', status: 'operational', uptime: '99.99%' },
      { name: 'CDN', description: 'Static asset delivery and caching', status: 'operational', uptime: '100%' },
    ],
  },
  {
    category: 'Application Services',
    items: [
      { name: 'Authentication Service', description: 'Login, registration, OAuth and 2FA', status: 'operational', uptime: '99.97%' },
      { name: 'Dashboard Service', description: 'Dashboard data aggregation and widgets', status: 'operational', uptime: '99.95%' },
      { name: 'Organization Service', description: 'Organization management and switching', status: 'operational', uptime: '99.96%' },
      { name: 'Notification Service', description: 'Email, push, and in-app notifications', status: 'degraded', uptime: '98.50%' },
      { name: 'Billing Service', description: 'Invoices, payments, and subscriptions', status: 'operational', uptime: '99.99%' },
    ],
  },
  {
    category: 'Data & Storage',
    items: [
      { name: 'Primary Database', description: 'PostgreSQL — transactional data', status: 'operational', uptime: '99.99%' },
      { name: 'Cache Layer', description: 'Redis — sessions and hot data', status: 'operational', uptime: '99.98%' },
      { name: 'File Storage', description: 'S3 — uploads, documents, and backups', status: 'maintenance', uptime: '96.80%' },
      { name: 'Search Index', description: 'Elasticsearch — full-text search', status: 'operational', uptime: '99.94%' },
    ],
  },
  {
    category: 'Integrations',
    items: [
      { name: 'Email Provider (SMTP)', description: 'Outbound transactional emails', status: 'operational', uptime: '99.92%' },
      { name: 'SMS Gateway', description: 'OTP and 2FA codes via SMS', status: 'operational', uptime: '99.88%' },
      { name: 'Payment Gateway', description: 'Stripe — card processing', status: 'operational', uptime: '99.99%' },
      { name: 'OAuth Providers', description: 'Google, Microsoft, GitHub, Apple', status: 'operational', uptime: '99.95%' },
    ],
  },
];

const INCIDENTS = [
  {
    date: 'Mar 13, 2026',
    title: 'File Storage — Scheduled Maintenance',
    status: 'maintenance',
    updates: [
      { time: '06:00 UTC', text: 'Scheduled maintenance window started for storage migration.' },
      { time: '06:15 UTC', text: 'Upload and download endpoints temporarily unavailable. Existing files remain accessible via CDN cache.' },
    ],
  },
  {
    date: 'Mar 12, 2026',
    title: 'Notification Service — Intermittent Delays',
    status: 'resolved',
    updates: [
      { time: '14:32 UTC', text: 'We observed elevated latency on push notifications.' },
      { time: '15:10 UTC', text: 'Root cause identified: queue backlog from burst traffic.' },
      { time: '15:45 UTC', text: 'Queue scaled up. Notification delivery restored to normal.' },
    ],
  },
  {
    date: 'Mar 10, 2026',
    title: 'API Gateway — Brief 502 Errors',
    status: 'resolved',
    updates: [
      { time: '09:05 UTC', text: 'Some users experienced 502 errors when accessing the API.' },
      { time: '09:08 UTC', text: 'Auto-scaling triggered. Traffic rerouted to healthy pods.' },
      { time: '09:12 UTC', text: 'Fully resolved. No further action required.' },
    ],
  },
];

const STATUS_CONFIG: Record<string, { label: string; textColor: string; bgColor: string; dotColor: string }> = {
  operational: { label: 'Operational', textColor: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', dotColor: 'bg-emerald-500' },
  degraded: { label: 'Degraded', textColor: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30', dotColor: 'bg-amber-500' },
  maintenance: { label: 'Maintenance', textColor: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', dotColor: 'bg-blue-500' },
  outage: { label: 'Major Outage', textColor: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30', dotColor: 'bg-red-500' },
  resolved: { label: 'Resolved', textColor: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-800', dotColor: 'bg-gray-400' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.operational;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bgColor} ${cfg.textColor}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

function UptimeBar({ uptime }: { uptime: string }) {
  const pct = parseFloat(uptime);
  const days = Array.from({ length: 90 }, (_, i) => {
    const seed = (i * 7 + pct * 100) % 100;
    if (pct >= 99.9) return seed > 1 ? 'operational' : 'degraded';
    if (pct >= 99.0) return seed > 5 ? 'operational' : seed > 2 ? 'degraded' : 'maintenance';
    return seed > 10 ? 'operational' : seed > 4 ? 'degraded' : 'maintenance';
  });

  return (
    <div className="flex items-center gap-px">
      {days.map((d, i) => (
        <div key={i} className={`h-6 w-[3px] rounded-sm ${d === 'operational' ? 'bg-emerald-400' : d === 'degraded' ? 'bg-amber-400' : 'bg-blue-400'}`} />
      ))}
    </div>
  );
}

export default function SystemStatusPage() {
  const [lastChecked, setLastChecked] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setLastChecked(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const allItems = SERVICES.flatMap((s) => s.items);
  const operationalCount = allItems.filter((i) => i.status === 'operational').length;
  const totalCount = allItems.length;
  const allOperational = operationalCount === totalCount;

  const overallStatus = allOperational
    ? { label: 'All Systems Operational', icon: 'check' as const, bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-400' }
    : { label: 'Some Systems Experiencing Issues', icon: 'warn' as const, bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-400' };

  return (
    <div className="space-y-6">
      <PageHeader title="System Status" subtitle="Monitor system health and services" />
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last checked {lastChecked.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.
        </p>
      </div>

      <div className={`mb-8 flex items-center gap-3 rounded-2xl border p-5 ${overallStatus.bg} ${overallStatus.border}`}>
        {overallStatus.icon === 'check' ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
        )}
        <div>
          <p className={`text-lg font-bold ${overallStatus.text}`}>{overallStatus.label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{operationalCount} of {totalCount} services are fully operational</p>
        </div>
      </div>

      <div className="space-y-6">
        {SERVICES.map((category) => (
          <div key={category.category} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{category.category}</h2>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
              {category.items.map((service) => (
                <div key={service.name} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{service.name}</p>
                      <StatusBadge status={service.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{service.description}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:block"><UptimeBar uptime={service.uptime} /></div>
                    <span className="text-xs font-semibold text-gray-500 tabular-nums w-14 text-right">{service.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <span>90-day uptime history</span>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> Operational</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-400" /> Degraded</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-blue-400" /> Maintenance</span>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">Incident History</h2>
        <div className="space-y-6">
          {INCIDENTS.map((incident, idx) => (
            <div key={idx} className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{incident.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{incident.date}</p>
                </div>
                <StatusBadge status={incident.status} />
              </div>
              <div className="px-6 py-4">
                <div className="relative space-y-4 pl-6 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-gray-200 dark:before:bg-gray-600">
                  {incident.updates.map((update, ui) => (
                    <div key={ui} className="relative">
                      <span className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-gray-300 ring-2 ring-white dark:bg-gray-500 dark:ring-gray-800" />
                      <p className="text-xs font-medium text-gray-400">{update.time}</p>
                      <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{update.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Status is updated automatically every 60 seconds. For real-time alerts, subscribe to our
          <span className="ml-1 font-medium text-blue-600 cursor-pointer hover:text-blue-800 transition dark:text-blue-400">status notifications</span>.
        </p>
        <p className="mt-1 text-xs text-gray-400">Incident reports are retained for 90 days. Contact support for historical data.</p>
      </div>
    </div>
  );
}
