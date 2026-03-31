import { APP_NAME } from '@/lib/config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enterprise Resource Planning</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
}
