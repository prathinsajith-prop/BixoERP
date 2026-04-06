'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/auth';
import { showToast } from '@erp/shell';

const registerSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
type RegisterFormData = z.infer<typeof registerSchema>;

interface InvitePreview {
    email?: string;
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

    const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });
    const watchedPassword = watch('password') ?? '';

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
        try {
            await authApi.acceptInvite({ token });
            showToast.success('Invitation accepted', 'You have joined the organisation.');
            setDone(true);
            setTimeout(() => router.replace('/'), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to accept invitation';
            showToast.error('Something went wrong', msg);
        } finally {
            setAccepting(false);
        }
    };

    const handleRegisterAndAccept = async (formData: RegisterFormData) => {
        if (!token) return;
        setAccepting(true);
        try {
            await authApi.acceptInvite({
                token,
                firstName: formData.firstName,
                lastName: formData.lastName,
                password: formData.password,
            });
            showToast.success('Account created', 'Your account is ready. Please log in.');
            setDone(true);
            const email = preview?.email ? `?email=${encodeURIComponent(preview.email)}` : '';
            setTimeout(() => router.replace(`/login${email}`), 2000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to create account';
            showToast.error('Something went wrong', msg);
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
                    Redirecting…
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

                    {isAuthenticated ? (
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {accepting ? 'Accepting…' : 'Accept Invitation'}
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit(handleRegisterAndAccept)} className="space-y-4">
                            {preview.email && (
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                                    <input
                                        readOnly
                                        value={preview.email}
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">First name</label>
                                    <input
                                        {...register('firstName')}
                                        placeholder="First name"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    />
                                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Last name</label>
                                    <input
                                        {...register('lastName')}
                                        placeholder="Last name"
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                    />
                                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Password</label>
                                <input
                                    {...register('password')}
                                    type="password"
                                    placeholder="Min 8 characters"
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                                {watchedPassword.length > 0 && (
                                    <div className="mt-1.5 flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => {
                                            const met = [
                                                watchedPassword.length >= 8,
                                                /[A-Z]/.test(watchedPassword),
                                                /[a-z]/.test(watchedPassword),
                                                /\d/.test(watchedPassword),
                                                /[!@#$%^&*(),.?":{}|<>]/.test(watchedPassword),
                                            ].filter(Boolean).length;
                                            const color = met <= 2 ? 'bg-red-500' : met <= 3 ? 'bg-amber-500' : met <= 4 ? 'bg-blue-500' : 'bg-emerald-500';
                                            return <div key={i} className={`h-1.5 flex-1 rounded-full transition ${i <= met ? color : 'bg-gray-100 dark:bg-gray-700'}`} />;
                                        })}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Confirm password</label>
                                <input
                                    {...register('confirmPassword')}
                                    type="password"
                                    placeholder="Repeat password"
                                    autoComplete="new-password"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                                />
                                {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
                            </div>
                            <button
                                type="submit"
                                disabled={accepting}
                                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {accepting ? 'Creating account…' : 'Create account & join'}
                            </button>
                        </form>
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
