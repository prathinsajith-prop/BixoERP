'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import AuthLayout from '@/components/layout/auth-layout';
import { Button, Alert } from '@erp/ui';

function OTPInput({ length = 6, value, onChange, autoFocus = true }: { length?: number; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) inputRefs.current[0].focus();
  }, [autoFocus]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const newValue = value.split('');
    newValue[index] = digit;
    const joined = newValue.join('').slice(0, length);
    onChange(joined.padEnd(length, ' '));
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index]?.trim() && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted.padEnd(length, ' '));
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }, (_, i) => (
        <input key={i} ref={(el) => { inputRefs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
          value={value[i] === ' ' ? '' : (value[i] || '')}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-14 w-11 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-center text-xl font-bold text-gray-900 dark:text-white shadow-sm outline-none transition focus:border-accent-500 focus:ring-4 focus:ring-accent-100 sm:h-16 sm:w-14 sm:text-2xl"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const { completeTwoFactor } = useAuthStore();
  const [otp, setOtp] = useState('      ');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [method, setMethod] = useState('authenticator');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const twoFactorToken = typeof window !== 'undefined' ? sessionStorage.getItem('2fa_token') : null;
  const userEmail = typeof window !== 'undefined' ? sessionStorage.getItem('2fa_email') || 'a•••n@bixo.com' : '';

  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('2fa_token')) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (useBackupCode) {
      if (!backupCode.trim()) { setMessage({ type: 'error', text: 'Please enter a backup code.' }); return; }
    } else {
      if (otp.trim().length !== 6) { setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' }); return; }
    }
    setVerifying(true);
    setMessage(null);
    setAttempts((a) => a + 1);
    try {
      const code = useBackupCode ? backupCode.trim() : otp.trim();
      await completeTwoFactor(twoFactorToken!, code);
      sessionStorage.removeItem('2fa_token');
      sessionStorage.removeItem('2fa_email');
      router.replace('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Invalid code. Please try again.';
      setMessage({ type: 'error', text: msg });
    } finally { setVerifying(false); }
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setMessage({ type: 'success', text: 'A new code has been sent.' });
  };

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50">
          <svg className="h-8 w-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">Two-Factor Verification</h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {useBackupCode ? 'Enter one of your backup codes to sign in.' : `Enter the verification code from your ${method === 'authenticator' ? 'authenticator app' : method}.`}
        </p>
      </div>

      {message && <div className="mb-5"><Alert variant={message.type}>{message.text}</Alert></div>}

      {!useBackupCode && (
        <div className="mb-6 flex gap-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
          {[{ key: 'authenticator', label: 'App' }, { key: 'sms', label: 'SMS' }, { key: 'email', label: 'Email' }].map((m) => (
            <button key={m.key} onClick={() => { setMethod(m.key); setOtp('      '); setMessage(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${method === m.key ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {useBackupCode ? (
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Backup Code</label>
          <input type="text" value={backupCode} onChange={(e) => setBackupCode(e.target.value.toUpperCase())} placeholder="e.g. A4F2-K8M1"
            className="block w-full rounded-xl border-2 border-gray-200 dark:border-gray-600 px-4 py-3.5 text-center font-mono text-lg font-bold tracking-widest text-gray-900 dark:text-white shadow-sm outline-none transition placeholder:text-gray-300 focus:border-accent-500 focus:ring-4 focus:ring-accent-100 bg-white dark:bg-gray-800"
            autoComplete="one-time-code" />
          <p className="mt-2 text-center text-xs text-gray-500">Enter one of your 8-character backup codes</p>
        </div>
      ) : (
        <div className="mb-6">
          <OTPInput value={otp} onChange={setOtp} />
          <div className="mt-4 text-center">
            {method === 'authenticator' ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div className="h-full w-2/3 rounded-full bg-accent-500 transition-all" />
                </div>
                <span className="text-xs text-gray-500">Code refreshes every 30s</span>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-500">Code sent to {method === 'sms' ? '•••••••4567' : userEmail}</p>
                <button onClick={handleResend} disabled={resendCooldown > 0} className={`mt-1.5 text-xs font-semibold transition ${resendCooldown > 0 ? 'cursor-not-allowed text-gray-400' : 'text-accent-600 hover:text-accent-500'}`}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-4">
        <Button loading={verifying} onClick={handleVerify} className="w-full">{useBackupCode ? 'Verify Backup Code' : 'Verify & Sign In'}</Button>
      </div>

      <div className="mb-4 text-center">
        <button onClick={() => { setUseBackupCode(!useBackupCode); setMessage(null); setOtp('      '); setBackupCode(''); }} className="text-sm font-medium text-accent-600 transition hover:text-accent-500">
          {useBackupCode ? 'Use verification code instead' : 'Use a backup code'}
        </button>
      </div>

      {attempts >= 3 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 px-4 py-3 text-center">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-400">Multiple failed attempts detected. Your account may be temporarily locked after 5 attempts.</p>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4">
        <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Need help?</p>
        <ul className="space-y-1.5 text-xs text-gray-500">
          <li className="flex gap-2"><svg className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>Open your authenticator app and find the 6-digit code for &quot;Bixo&quot;</li>
          <li className="flex gap-2"><svg className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>If you lost your device, use a backup code to regain access</li>
          <li className="flex gap-2"><svg className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>Contact your administrator if you&apos;re locked out completely</li>
        </ul>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        <button onClick={() => router.push('/login')} className="font-medium text-accent-600 transition hover:text-accent-500">← Back to Sign In</button>
      </p>
    </AuthLayout>
  );
}
