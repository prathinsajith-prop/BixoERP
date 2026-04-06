'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import AuthLayout from '@/components/layout/auth-layout';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';
import { showToast } from '@erp/shell';

const resetSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

    const onSubmit = async (data: ResetFormData) => {
        if (!token) return;
        setSubmitting(true);
        setServerError(null);
        try {
            await authApi.passwordResetConfirm({ token, password: data.password });
            showToast.success('Password reset', 'You can now sign in with your new password.');
            setDone(true);
            setTimeout(() => router.replace('/login'), 2500);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
                'This reset link is invalid or has expired.';
            setServerError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // No token in the URL
    if (!token) {
        return (
            <AuthLayout>
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                        <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invalid reset link</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This password reset link is missing or malformed.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        Return to sign in
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    // Success state
    if (done) {
        return (
            <AuthLayout>
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                        <svg className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password updated!</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Redirecting you to sign in…
                    </p>
                    <Link
                        href="/login"
                        className="inline-block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        Sign in now
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    // Expired / used token error state
    if (serverError && serverError.toLowerCase().includes('invalid')) {
        return (
            <AuthLayout>
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                        <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Link expired</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{serverError}</p>
                    <Link
                        href="/forgot-password"
                        className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                    >
                        Request a new reset link
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Set a new password
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Choose a strong password for your account.
            </p>

            {serverError && (
                <div className="mb-4">
                    <Alert>{serverError}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <Input
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    {...register('password')}
                />
                <Input
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                />

                <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
                    {submitting ? 'Updating password…' : 'Reset password'}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Remembered your password?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordContent />
        </Suspense>
    );
}
