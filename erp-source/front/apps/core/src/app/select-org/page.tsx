'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const ROLE_BADGE_COLOURS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  MANAGER: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  MEMBER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function roleBadge(role: string) {
  return ROLE_BADGE_COLOURS[role?.toUpperCase()] ?? ROLE_BADGE_COLOURS['MEMBER'];
}

export default function SelectOrgPage() {
  const router = useRouter();
  const { pendingToken, pendingOrganisations, selectOrg, isLoading, error } = useAuthStore();

  // Guard: no pending token means the user shouldn't be here
  useEffect(() => {
    if (!pendingToken) {
      router.replace('/login');
    }
  }, [pendingToken, router]);

  if (!pendingToken) return null;

  const handleSelect = async (orgId: string) => {
    try {
      await selectOrg(orgId);
      router.replace('/');
    } catch {
      // error shown via store.error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose an organisation</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your account belongs to multiple organisations. Select one to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {pendingOrganisations.map((org) => (
            <button
              key={org.orgId}
              onClick={() => handleSelect(org.orgId)}
              disabled={isLoading}
              className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
            >
              {/* Org avatar */}
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow">
                {org.orgName?.charAt(0)?.toUpperCase() ?? 'O'}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                  {org.orgName}
                </p>
                <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                  /{org.orgSlug}
                </p>
              </div>

              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge(org.role)}`}>
                  {org.role}
                </span>
                {org.membershipType && org.membershipType !== 'REGULAR' && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{org.membershipType}</span>
                )}
              </div>

              {/* Arrow */}
              <svg
                className="h-5 w-5 flex-shrink-0 text-gray-300 transition group-hover:text-indigo-500 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Signing you in…
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
          Not the right account?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Sign in with a different account
          </a>
        </p>
      </div>
    </div>
  );
}
