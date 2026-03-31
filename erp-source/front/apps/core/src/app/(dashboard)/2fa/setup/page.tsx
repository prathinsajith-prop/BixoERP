'use client';

import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { APP_NAME } from '@/lib/config';
import Button from '@/components/ui/button';
import Alert from '@/components/ui/alert';

const STEPS = [
  { key: 'intro', label: 'Get Started' },
  { key: 'scan', label: 'Scan QR Code' },
  { key: 'verify', label: 'Verify Code' },
  { key: 'backup', label: 'Backup Codes' },
  { key: 'done', label: 'Complete' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const isActive = i === current;
        const isDone = i < current;
        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              isDone ? 'bg-green-500 text-white' : isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
            }`}>
              {isDone ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ) : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`hidden h-0.5 w-8 sm:block ${isDone ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
          </div>
        );
      })}
    </div>
  );
}

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
    const nextIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] === ' ' ? '' : (value[i] || '')}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-14 w-11 rounded-xl border-2 border-gray-200 bg-white text-center text-xl font-bold text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:h-16 sm:w-14 sm:text-2xl dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900/50"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

const MOCK_BACKUP_CODES = ['A4F2-K8M1', 'B7G3-L9N2', 'C1H5-P3R6', 'D8J4-Q7S9', 'E2K6-T1V5', 'F9L8-W4X3', 'G3M7-Y6Z2', 'H5N1-A9B8'];

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [otp, setOtp] = useState('      ');
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [method, setMethod] = useState('authenticator');
  const [backupCopied, setBackupCopied] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [setupData, setSetupData] = useState<{ secret?: string; qrCodeDataUrl?: string } | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState(MOCK_BACKUP_CODES);

  const secret = setupData?.secret || 'JBSWY3DPEHPK3PXP';
  const qrCodeDataUrl = setupData?.qrCodeDataUrl || null;

  const handleProceedToScan = async () => {
    setSetupLoading(true);
    setMessage(null);
    try {
      const { data } = await authApi.twoFactorSetup();
      setSetupData(data.data);
      setStep(1);
    } catch {
      setMessage({ type: 'error', text: 'Failed to initialize 2FA setup. Please try again.' });
    } finally {
      setSetupLoading(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.trim();
    if (code.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code.' });
      return;
    }
    setVerifying(true);
    setMessage(null);
    try {
      const { data } = await authApi.twoFactorVerifySetup({ code });
      setRecoveryCodes(data.data?.recoveryCodes || MOCK_BACKUP_CODES);
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Invalid verification code. Please try again.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyBackup = () => {
    navigator.clipboard?.writeText(recoveryCodes.join('\n'));
    setBackupCopied(true);
    setTimeout(() => setBackupCopied(false), 2000);
  };

  const handleDownloadBackup = () => {
    const text = `${APP_NAME} - 2FA Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n${'─'.repeat(30)}\n\n${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes in a safe place.\nEach code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bixo-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Two-Factor Setup" subtitle="Enhance your account security" />
      <StepIndicator current={step} />
      {message && <div className="mb-6"><Alert type={message.type}>{message.text}</Alert></div>}

      {/* Step 0 — Intro */}
      {step === 0 && (
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Protect Your Account</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Two-factor authentication adds an extra layer of security.</p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z', title: 'Phishing Protection', desc: 'Blocks unauthorized access' },
              { icon: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z', title: 'Stronger Security', desc: 'Two layers of verification' },
              { icon: 'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3', title: 'Easy to Use', desc: 'Quick 30-second codes' },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center dark:border-gray-800 dark:bg-gray-800/50">
                <svg className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={b.icon} /></svg>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{b.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Choose your method</p>
            <div className="space-y-3">
              {[
                { key: 'authenticator', title: 'Authenticator App', desc: 'Google Authenticator, Authy, or Microsoft Authenticator', recommended: true },
                { key: 'sms', title: 'SMS / Text Message', desc: 'Receive a code via text message to your phone', recommended: false },
                { key: 'email', title: 'Email', desc: 'Receive a verification code to your email address', recommended: false },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition ${
                    method === m.key ? 'border-blue-500 bg-blue-50/50 shadow-sm dark:bg-blue-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${method === m.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {m.key === 'authenticator' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>}
                    {m.key === 'sms' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
                    {m.key === 'email' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.title}</p>
                      {m.recommended && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">RECOMMENDED</span>}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
                  </div>
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${method === m.key ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                    {method === m.key && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button loading={setupLoading} onClick={handleProceedToScan}>
            Continue with {method === 'authenticator' ? 'Authenticator App' : method === 'sms' ? 'SMS' : 'Email'}
          </Button>
        </div>
      )}

      {/* Step 1 — Scan QR */}
      {step === 1 && (
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          {method === 'authenticator' ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Scan the QR Code</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open your authenticator app and scan this QR code.</p>
              </div>
              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900">
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="Scan this QR code" className="h-40 w-40" />
                    ) : (
                      <div className="relative">
                        <svg className="h-40 w-40" viewBox="0 0 200 200">
                          <rect x="10" y="10" width="60" height="60" rx="8" fill="#1e293b" />
                          <rect x="20" y="20" width="40" height="40" rx="4" fill="white" />
                          <rect x="30" y="30" width="20" height="20" rx="2" fill="#1e293b" />
                          <rect x="130" y="10" width="60" height="60" rx="8" fill="#1e293b" />
                          <rect x="140" y="20" width="40" height="40" rx="4" fill="white" />
                          <rect x="150" y="30" width="20" height="20" rx="2" fill="#1e293b" />
                          <rect x="10" y="130" width="60" height="60" rx="8" fill="#1e293b" />
                          <rect x="20" y="140" width="40" height="40" rx="4" fill="white" />
                          <rect x="30" y="150" width="20" height="20" rx="2" fill="#1e293b" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-lg bg-white p-1.5 shadow-md">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white text-xs font-bold">{APP_NAME.charAt(0)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Can&apos;t scan? Enter this key manually</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-white px-3 py-2.5 font-mono text-sm tracking-widest text-gray-900 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-white dark:ring-gray-700">{secretRevealed ? secret : '••••••••••••••••'}</code>
                  <button onClick={() => setSecretRevealed(!secretRevealed)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">{secretRevealed ? 'Hide' : 'Reveal'}</button>
                  {secretRevealed && <button onClick={() => navigator.clipboard?.writeText(secret)} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Copy</button>}
                </div>
              </div>
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
                <p className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">Setup Instructions</p>
                <ol className="space-y-1.5 text-xs text-blue-800 dark:text-blue-400">
                  <li className="flex gap-2"><span className="font-bold">1.</span> Download an authenticator app if you haven&apos;t already</li>
                  <li className="flex gap-2"><span className="font-bold">2.</span> Open the app and tap the &quot;+&quot; or &quot;Add account&quot; button</li>
                  <li className="flex gap-2"><span className="font-bold">3.</span> Scan the QR code above or enter the secret key manually</li>
                  <li className="flex gap-2"><span className="font-bold">4.</span> Click &quot;Continue&quot; to verify with the code from your app</li>
                </ol>
              </div>
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recommended Apps</p>
                <div className="flex flex-wrap gap-2">
                  {['Google Authenticator', 'Authy', 'Microsoft Authenticator', '1Password'].map((app) => (
                    <span key={app} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">{app}</span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{method === 'sms' ? 'Verify Your Phone Number' : 'Verify Your Email'}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{method === 'sms' ? "We'll send a verification code to your phone." : "We'll send a verification code to your email."}</p>
              <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
                <svg className="h-10 w-10 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {method === 'sms' ? <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />}
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">{method === 'sms' ? 'Phone: •••••••4567' : 'Email: a•••n@bixo.com'}</p>
              <button className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">Send Code</button>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Back</button>
            <Button className="flex-1" onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 2 — Verify OTP */}
      {step === 2 && (
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
              <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter Verification Code</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{method === 'authenticator' ? 'Enter the 6-digit code from your authenticator app.' : method === 'sms' ? 'Enter the 6-digit code sent to your phone.' : 'Enter the 6-digit code sent to your email.'}</p>
          </div>
          <div className="mb-6"><OTPInput value={otp} onChange={setOtp} /></div>
          <div className="mb-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{method === 'authenticator' ? 'The code refreshes every 30 seconds' : 'Code expires in 10 minutes'}</p>
            {method !== 'authenticator' && <button className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400">Resend code</button>}
          </div>
          {method === 'authenticator' && (
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full w-3/4 rounded-full bg-blue-500 transition-all" /></div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">~22s remaining</span>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setOtp('      '); setMessage(null); }} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Back</button>
            <div className="flex-1"><Button loading={verifying} onClick={handleVerify}>Verify & Enable</Button></div>
          </div>
          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Having trouble?</p>
            <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <li>• Make sure the time on your device is synced correctly</li>
              <li>• Try scanning the QR code again in your authenticator app</li>
              <li>• Use the manual secret key if scanning doesn&apos;t work</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 3 — Backup Codes */}
      {step === 3 && (
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
              <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Save Your Backup Codes</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Each code can only be used once. Store them securely.</p>
          </div>
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
            <div className="flex gap-2">
              <svg className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Store these codes securely. You won&apos;t be able to see them again.</p>
            </div>
          </div>
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-3">
              {recoveryCodes.map((code, i) => (
                <div key={code} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 font-mono text-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                  <span className="text-xs font-medium text-gray-400">{i + 1}.</span>
                  <span className="font-semibold tracking-wider text-gray-900 dark:text-white">{code}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-8 flex gap-3">
            <button onClick={handleCopyBackup} className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${backupCopied ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400' : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'}`}>
              {backupCopied ? (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Copied!</>
              ) : (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>Copy All</>
              )}
            </button>
            <button onClick={handleDownloadBackup} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              Download .txt
            </button>
          </div>
          <Button onClick={() => setStep(4)}>I&apos;ve Saved My Codes — Continue</Button>
        </div>
      )}

      {/* Step 4 — Done */}
      {step === 4 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50 dark:bg-green-900/30 dark:ring-green-900/20">
            <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication Enabled!</h2>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Your account is now secured with an additional layer of protection.</p>
          <div className="mx-auto mb-8 max-w-sm space-y-3 rounded-xl border border-green-100 bg-green-50/50 p-5 text-left dark:border-green-900/50 dark:bg-green-900/20">
            <p className="text-sm font-semibold text-green-900 dark:text-green-300">What happens next:</p>
            <div className="space-y-2 text-xs text-green-800 dark:text-green-400">
              {['You\'ll need a verification code every time you sign in', `Use your backup codes if you lose access to your ${method === 'authenticator' ? 'authenticator app' : method === 'sms' ? 'phone' : 'email'}`, 'You can manage 2FA settings from the Settings page'].map((t, i) => (
                <div key={i} className="flex gap-2">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/settings')} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Go to Settings</button>
            <div className="flex-1"><Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
