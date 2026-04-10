'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api/auth';
import AuthLayout from '@/components/layout/auth-layout';
import { Button, Input, Alert } from '@erp/ui';

const schema = z.object({
    email: z.string().email('Enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

function ForgotPasswordContent() {
    const [submitted, setSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        try {
            await authApi.passwordResetRequest({ email: data.email });
            setSubmittedEmail(data.email);
            setSubmitted(true);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
                'Something went wrong. Please try again.';
            setServerError(msg);
        }
    };

    if (submitted) {
        return (
            <AuthLayout>
                <div className="text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                        <svg className="h-7 w-7 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Check your email</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        We sent a password reset link to{' '}
                        <span className="font-medium text-gray-700 dark:text-gray-200">{submittedEmail}</span>.
                        The link expires in 1 hour.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Didn&apos;t receive it? Check your spam folder or{' '}
                        <button
                            type="button"
                            className="font-medium text-accent-600 hover:text-accent-500 underline"
                            onClick={() => setSubmitted(false)}
                        >
                            try again
                        </button>
                        .
                    </p>
                    <div className="pt-2">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-accent-600 hover:text-accent-500"
                        >
                            ← Back to sign in
                        </Link>
                    </div>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                    <svg className="h-7 w-7 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>
                <h2 className="text-center text-xl font-semibold text-gray-900 dark:text-white">Forgot your password?</h2>
                <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                    Enter your email and we&apos;ll send you a reset link.
                </p>
            </div>

            {serverError && (
                <div className="mb-4">
                    <Alert variant="error">{serverError}</Alert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    id="email"
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email')}
                />
                <Button type="submit" loading={isSubmitting} className="w-full">
                    Send reset link
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Remembered your password?{' '}
                <Link href="/login" className="font-medium text-accent-600 hover:text-accent-500">
                    Sign in
                </Link>
            </p>
        </AuthLayout>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense>
            <ForgotPasswordContent />
        </Suspense>
    );
}
