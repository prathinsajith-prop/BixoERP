'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';

interface InvitePreview {
    orgName: string;
    orgSlug: string;
    roleName: string;
    invitedBy?: string;
    message?: string;
    expiresAt?: string;
}

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const { isAuthenticated } = useAuthStore();

    const [preview, setPreview] = useState<InvitePreview | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [accepting, setAccepting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoadingPreview(true);
        authApi
            .getInvitePreview(token)
            .then(({ data }) => setPreview(data.data))
            .catch(() => setError('This invitation link is invalid or has expired.'))
            .finally(() => setLoadingPreview(false));
    }, [token]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        setError(null);
        try {
            await authApi.acceptInvite({ token });
            setDone(true);
            // Give short delay then navigate
            setTimeout(() => router.replace(isAuthenticated ? '/' : '/login'), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to accept invitation';
            setError(msg);
        } finally {
            setAccepting(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">Missing invitation token.</p>
                <a href="/login" className="mt-4 inline-block text-indigo-600 hover:underline dark:text-indigo-400">Go to login</a>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
                    <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">You&rsquo;ve been invited</h1>
            </div>

            {loadingPreview && (
                <div className="flex items-center justify-center gap-2 text-gray-400">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading invitation details…
                </div>
            )}

            {error && !loadingPreview && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}

            {done && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Invitation accepted! Redirecting…
                </div>
            )}

            {preview && !done && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">You have been invited to join</p>
                        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{preview.orgName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">/{preview.orgSlug}</p>
                    </div>

                    <div className="mb-4 flex items-center justify-center">
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {preview.roleName}
                        </span>
                    </div>

                    {preview.invitedBy && (
                        <p className="mb-2 text-center text-xs text-gray-400 dark:text-gray-500">
                            Invited by <span className="font-medium text-gray-600 dark:text-gray-300">{preview.invitedBy}</span>
                        </p>
                    )}

                    {preview.message && (
                        <div className="my-4 rounded-lg bg-gray-50 p-3 text-sm italic text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            &ldquo;{preview.message}&rdquo;
                        </div>
                    )}

                    {preview.expiresAt && (
                        <p className="mb-4 text-center text-xs text-gray-400 dark:text-gray-500">
                            Expires {new Date(preview.expiresAt).toLocaleDateString()}
                        </p>
                    )}

                    {error && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAccept}
                        disabled={accepting}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {accepting ? 'Accepting…' : 'Accept Invitation'}
                    </button>

                    {!isAuthenticated && (
                        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
                            You&rsquo;ll be asked to log in or register after accepting.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
            <Suspense>
                <AcceptInviteContent />
            </Suspense>
        </div>
    );
}
