'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@erp/shell';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import Alert from '@/components/ui/alert';
import PageHeader from '@/components/page-header';

const SIDEBAR_ITEMS = [
  { key: 'appearance', label: 'Appearance', icon: 'M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z' },
  { key: 'notifications', label: 'Notifications', icon: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
  { key: 'security', label: 'Security', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
  { key: 'privacy', label: 'Privacy', icon: 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' },
  { key: 'language', label: 'Language & Region', icon: 'M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495A18.023 18.023 0 0115.75 7.5' },
  { key: 'accessibility', label: 'Accessibility', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
  { key: 'data', label: 'Data & Storage', icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125' },
  { key: 'integrations', label: 'Integrations', icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244' },
  { key: 'keyboard', label: 'Keyboard Shortcuts', icon: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z' },
  { key: 'danger', label: 'Danger Zone', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
];

const SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Open command palette' },
  { keys: ['⌘', '/'], action: 'Toggle search' },
  { keys: ['⌘', 'N'], action: 'New item' },
  { keys: ['⌘', 'S'], action: 'Save changes' },
  { keys: ['⌘', '⇧', 'P'], action: 'Open profile' },
  { keys: ['⌘', '.'], action: 'Toggle sidebar' },
  { keys: ['Esc'], action: 'Close dialog / cancel' },
  { keys: ['⌘', 'D'], action: 'Go to dashboard' },
  { keys: ['⌘', '⇧', 'N'], action: 'Create new module' },
  { keys: ['⌘', 'B'], action: 'Toggle notifications' },
];

function SettingSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function Slider({ label, description, value, onChange, min = 0, max = 100, unit = '' }: { label: string; description?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div className="py-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600 dark:bg-gray-700" />
    </div>
  );
}

const selectClass = "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function SettingsPage() {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const loadedRef = useRef(false);
  const [activeSection, setActiveSection] = useState('appearance');
  const [mobileSectionOpen, setMobileSectionOpen] = useState(false);

  const { theme, setTheme, accentColor, setAccentColor, compactMode, setCompactMode, fontSize, setFontSize, animationsEnabled, setAnimationsEnabled, reducedMotion, setReducedMotion } = useTheme();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [mentionNotifs, setMentionNotifs] = useState(true);
  const [taskNotifs, setTaskNotifs] = useState(true);
  const [moduleUpdates, setModuleUpdates] = useState(true);
  const [desktopNotifs, setDesktopNotifs] = useState(false);
  const [notifSound, setNotifSound] = useState('default');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  useEffect(() => { authApi.twoFactorStatus().then(({ data }) => setTwoFactorEnabled(data.data.enabled)).catch(() => {}); }, []);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [ipWhitelisting, setIpWhitelisting] = useState(false);
  const [passwordExpiry, setPasswordExpiry] = useState('90');
  const [biometricLogin, setBiometricLogin] = useState(false);

  const [activityStatus, setActivityStatus] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('everyone');
  const [searchable, setSearchable] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState('sunday');
  const [numberFormat, setNumberFormat] = useState('1,000.00');
  const [currency, setCurrency] = useState('USD');

  const [highContrast, setHighContrast] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);
  const [focusIndicators, setFocusIndicators] = useState(true);
  const [autoplayMedia, setAutoplayMedia] = useState(false);
  const [textSpacing, setTextSpacing] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [tooltipDelay, setTooltipDelay] = useState(500);

  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(5);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  const [slackConnected, setSlackConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [zapierConnected, setZapierConnected] = useState(false);
  const [webhooksEnabled, setWebhooksEnabled] = useState(false);
  const [apiAccess, setApiAccess] = useState(true);

  function buildPayload() {
    return {
      appearance: { theme, accentColor, fontSize, compactMode, animations: animationsEnabled, reducedMotion },
      notifications: { channels: { email: emailNotifs, push: pushNotifs, desktop: desktopNotifs, sound: soundEnabled, soundPicker: notifSound }, activityTypes: { mentions: mentionNotifs, tasks: taskNotifs, moduleUpdates, digest: weeklyDigest }, quietHours: { enabled: quietHoursEnabled, start: quietStart, end: quietEnd } },
      security: { twoFactorEnabled, biometricLogin, loginAlerts, ipWhitelisting, sessionTimeoutMinutes: sessionTimeout, passwordExpiryDays: Number(passwordExpiry) },
      privacy: { profileVisibility, showEmail, showPhone, searchVisibility: searchable, activityStatus, readReceipts, analyticsOptIn, thirdPartyDataSharing: dataSharing },
      languageRegion: { language, timezone, firstDayOfWeek, dateFormat, timeFormat, numberFormat, currency },
      accessibility: { highContrast, textSpacing, focusIndicators, keyboardNavigation, screenReaderOptimization: screenReaderOptimized, autoplayMedia, closedCaptions: captionsEnabled, tooltipDelayMs: tooltipDelay },
      dataStorage: { autoSave, autoSaveIntervalSeconds: autoSaveInterval * 60, cacheEnabled, offlineMode },
      integrations: { connectedApps: { slack: slackConnected, google: googleConnected, microsoft: microsoftConnected, jira: jiraConnected, github: githubConnected, zapier: zapierConnected }, apiAccessEnabled: apiAccess, webhooksEnabled },
    };
  }

  function applySettings(d: any) {
    const a = d.appearance ?? {};
    if (a.theme) setTheme(a.theme);
    if (a.accentColor) setAccentColor(a.accentColor);
    if (a.fontSize) setFontSize(a.fontSize);
    if (a.compactMode !== undefined) setCompactMode(a.compactMode);
    if (a.animations !== undefined) setAnimationsEnabled(a.animations);
    if (a.reducedMotion !== undefined) setReducedMotion(a.reducedMotion);

    const n = d.notifications ?? {}; const nc = n.channels ?? {};
    if (nc.email !== undefined) setEmailNotifs(nc.email);
    if (nc.push !== undefined) setPushNotifs(nc.push);
    if (nc.desktop !== undefined) setDesktopNotifs(nc.desktop);
    if (nc.sound !== undefined) setSoundEnabled(nc.sound);
    if (nc.soundPicker) setNotifSound(nc.soundPicker);
    const na = n.activityTypes ?? {};
    if (na.mentions !== undefined) setMentionNotifs(na.mentions);
    if (na.tasks !== undefined) setTaskNotifs(na.tasks);
    if (na.moduleUpdates !== undefined) setModuleUpdates(na.moduleUpdates);
    if (na.digest !== undefined) setWeeklyDigest(na.digest);
    const nq = n.quietHours ?? {};
    if (nq.enabled !== undefined) setQuietHoursEnabled(nq.enabled);
    if (nq.start) setQuietStart(nq.start);
    if (nq.end) setQuietEnd(nq.end);
    const sec = d.security ?? {};
    if (sec.twoFactorEnabled !== undefined) setTwoFactorEnabled(sec.twoFactorEnabled);
    if (sec.biometricLogin !== undefined) setBiometricLogin(sec.biometricLogin);
    if (sec.loginAlerts !== undefined) setLoginAlerts(sec.loginAlerts);
    if (sec.ipWhitelisting !== undefined) setIpWhitelisting(sec.ipWhitelisting);
    if (sec.sessionTimeoutMinutes) setSessionTimeout(sec.sessionTimeoutMinutes);
    if (sec.passwordExpiryDays !== undefined) setPasswordExpiry(String(sec.passwordExpiryDays));
    const pr = d.privacy ?? {};
    if (pr.profileVisibility) setProfileVisibility(pr.profileVisibility);
    if (pr.showEmail !== undefined) setShowEmail(pr.showEmail);
    if (pr.showPhone !== undefined) setShowPhone(pr.showPhone);
    if (pr.searchVisibility !== undefined) setSearchable(pr.searchVisibility);
    if (pr.activityStatus !== undefined) setActivityStatus(pr.activityStatus);
    if (pr.readReceipts !== undefined) setReadReceipts(pr.readReceipts);
    if (pr.analyticsOptIn !== undefined) setAnalyticsOptIn(pr.analyticsOptIn);
    if (pr.thirdPartyDataSharing !== undefined) setDataSharing(pr.thirdPartyDataSharing);
    const lr = d.languageRegion ?? {};
    if (lr.language) setLanguage(lr.language);
    if (lr.timezone) setTimezone(lr.timezone);
    if (lr.firstDayOfWeek) setFirstDayOfWeek(lr.firstDayOfWeek);
    if (lr.dateFormat) setDateFormat(lr.dateFormat);
    if (lr.timeFormat) setTimeFormat(lr.timeFormat);
    if (lr.numberFormat) setNumberFormat(lr.numberFormat);
    if (lr.currency) setCurrency(lr.currency);
    const ac = d.accessibility ?? {};
    if (ac.highContrast !== undefined) setHighContrast(ac.highContrast);
    if (ac.textSpacing !== undefined) setTextSpacing(ac.textSpacing);
    if (ac.focusIndicators !== undefined) setFocusIndicators(ac.focusIndicators);
    if (ac.keyboardNavigation !== undefined) setKeyboardNavigation(ac.keyboardNavigation);
    if (ac.screenReaderOptimization !== undefined) setScreenReaderOptimized(ac.screenReaderOptimization);
    if (ac.autoplayMedia !== undefined) setAutoplayMedia(ac.autoplayMedia);
    if (ac.closedCaptions !== undefined) setCaptionsEnabled(ac.closedCaptions);
    if (ac.tooltipDelayMs !== undefined) setTooltipDelay(ac.tooltipDelayMs);
    const ds = d.dataStorage ?? {};
    if (ds.autoSave !== undefined) setAutoSave(ds.autoSave);
    if (ds.autoSaveIntervalSeconds) setAutoSaveInterval(Math.round(ds.autoSaveIntervalSeconds / 60));
    if (ds.cacheEnabled !== undefined) setCacheEnabled(ds.cacheEnabled);
    if (ds.offlineMode !== undefined) setOfflineMode(ds.offlineMode);
    const ig = d.integrations ?? {}; const ca = ig.connectedApps ?? {};
    if (ca.slack !== undefined) setSlackConnected(ca.slack);
    if (ca.google !== undefined) setGoogleConnected(ca.google);
    if (ca.microsoft !== undefined) setMicrosoftConnected(ca.microsoft);
    if (ca.jira !== undefined) setJiraConnected(ca.jira);
    if (ca.github !== undefined) setGithubConnected(ca.github);
    if (ca.zapier !== undefined) setZapierConnected(ca.zapier);
    if (ig.apiAccessEnabled !== undefined) setApiAccess(ig.apiAccessEnabled);
    if (ig.webhooksEnabled !== undefined) setWebhooksEnabled(ig.webhooksEnabled);
  }

  useEffect(() => {
    authApi.getSettings().then(({ data }) => { if (data.data) applySettings(data.data); }).catch(() => {}).finally(() => { loadedRef.current = true; });
  }, []);

  useEffect(() => { if (loadedRef.current) setDirty(true); }, [
    theme, accentColor, fontSize, compactMode, animationsEnabled, reducedMotion,
    emailNotifs, pushNotifs, desktopNotifs, soundEnabled, notifSound, mentionNotifs, taskNotifs, moduleUpdates, weeklyDigest,
    quietHoursEnabled, quietStart, quietEnd, biometricLogin, loginAlerts, ipWhitelisting, sessionTimeout, passwordExpiry,
    profileVisibility, showEmail, showPhone, searchable, activityStatus, readReceipts, analyticsOptIn, dataSharing,
    language, timezone, firstDayOfWeek, dateFormat, timeFormat, numberFormat, currency,
    highContrast, textSpacing, focusIndicators, keyboardNavigation, screenReaderOptimized, autoplayMedia, captionsEnabled, tooltipDelay,
    autoSave, autoSaveInterval, cacheEnabled, offlineMode,
    slackConnected, googleConnected, microsoftConnected, jiraConnected, githubConnected, zapierConnected, apiAccess, webhooksEnabled,
  ]);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      await authApi.updateSettings(buildPayload());
      setDirty(false);
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message ?? 'Failed to save settings.' });
    } finally { setSaving(false); }
  };

  const ACCENT_COLORS = [
    { key: 'blue', color: 'bg-blue-500' }, { key: 'indigo', color: 'bg-indigo-500' }, { key: 'purple', color: 'bg-purple-500' },
    { key: 'pink', color: 'bg-pink-500' }, { key: 'red', color: 'bg-red-500' }, { key: 'orange', color: 'bg-orange-500' },
    { key: 'amber', color: 'bg-amber-500' }, { key: 'emerald', color: 'bg-emerald-500' }, { key: 'teal', color: 'bg-teal-500' }, { key: 'cyan', color: 'bg-cyan-500' },
  ];

  const storageUsed = 2.4, storageTotal = 10;

  const btnActive = "border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
  const btnInactive = "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-600";

  return (
    <>
      <PageHeader title="Settings" subtitle="Customize your preferences" />
      <div className="flex flex-col lg:flex-row lg:gap-0">
      <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto py-6 pr-4 lg:block">
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button key={item.key} onClick={() => setActiveSection(item.key)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${activeSection === item.key ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}`}>
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
              {item.label}
              {item.key === 'danger' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />}
            </button>
          ))}
        </nav>
      </aside>

      <div className="relative mb-4 w-full lg:hidden">
        {(() => {
          const active = SIDEBAR_ITEMS.find((i) => i.key === activeSection);
          return (
            <>
              <button
                onClick={() => setMobileSectionOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={active?.icon} /></svg>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{active?.label}</span>
                </span>
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${mobileSectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
              {mobileSectionOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMobileSectionOpen(false)} />
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    {SIDEBAR_ITEMS.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => { setActiveSection(item.key); setMobileSectionOpen(false); }}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition ${activeSection === item.key ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                      >
                        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                        {item.label}
                        {item.key === 'danger' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />}
                        {activeSection === item.key && <svg className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>

      <div className="min-w-0 flex-1">
        {message && <div className="mb-6"><Alert type={message.type}>{message.text}</Alert></div>}
        <div className="space-y-6">

          {/* Appearance */}
          {activeSection === 'appearance' && (<>
            <SettingSection title="Theme" description="Choose your preferred color scheme.">
              <div className="flex gap-3">
                {[{ key: 'light', emoji: '☀️' }, { key: 'dark', emoji: '🌙' }, { key: 'system', emoji: '💻' }].map((t) => (
                  <button key={t.key} onClick={() => setTheme(t.key)} className={`flex-1 rounded-xl border-2 px-4 py-4 text-center transition ${theme === t.key ? btnActive : btnInactive}`}>
                    <span className="text-2xl">{t.emoji}</span>
                    <p className="mt-1 text-sm font-medium capitalize">{t.key}</p>
                  </button>
                ))}
              </div>
            </SettingSection>
            <SettingSection title="Accent Color" description="Personalize the primary color across the interface.">
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map((c) => (
                  <button key={c.key} onClick={() => setAccentColor(c.key)} className={`flex h-10 w-10 items-center justify-center rounded-full transition ${c.color} ${accentColor === c.key ? 'ring-2 ring-offset-2 ring-gray-900 scale-110 dark:ring-white' : 'hover:scale-105'}`}>
                    {accentColor === c.key && <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                  </button>
                ))}
              </div>
            </SettingSection>
            <SettingSection title="Layout & Display" description="Adjust the interface density and behavior.">
              <Slider label="Font size" description="Adjust the base text size" value={fontSize} onChange={setFontSize} min={10} max={20} unit="px" />
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Compact mode" description="Reduce spacing and padding" checked={compactMode} onChange={setCompactMode} />
                <Toggle label="Animations" description="Enable transitions and motion effects" checked={animationsEnabled} onChange={setAnimationsEnabled} />
                <Toggle label="Reduced motion" description="Minimize non-essential movement" checked={reducedMotion} onChange={setReducedMotion} />
              </div>

            </SettingSection>
          </>)}

          {/* Notifications */}
          {activeSection === 'notifications' && (<>
            <SettingSection title="Channels" description="Control how you receive notifications.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Email notifications" description="Receive important updates via email" checked={emailNotifs} onChange={setEmailNotifs} />
                <Toggle label="Push notifications" description="Get real-time alerts in your browser" checked={pushNotifs} onChange={setPushNotifs} />
                <Toggle label="Desktop notifications" description="Show native desktop notification popups" checked={desktopNotifs} onChange={setDesktopNotifs} />
                <Toggle label="Sound alerts" description="Play a sound for incoming notifications" checked={soundEnabled} onChange={setSoundEnabled} />
              </div>
              {soundEnabled && (
                <div className="mt-4">
                  <label className={labelClass}>Notification sound</label>
                  <select value={notifSound} onChange={(e) => setNotifSound(e.target.value)} className={selectClass}>
                    <option value="default">Default</option><option value="chime">Chime</option><option value="ping">Ping</option><option value="pop">Pop</option><option value="bell">Bell</option><option value="none">None</option>
                  </select>
                </div>
              )}
            </SettingSection>
            <SettingSection title="Activity Types" description="Choose which events trigger notifications.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="@Mentions" description="When someone mentions you" checked={mentionNotifs} onChange={setMentionNotifs} />
                <Toggle label="Task assignments" description="When a task is assigned to you" checked={taskNotifs} onChange={setTaskNotifs} />
                <Toggle label="Module updates" description="Changes in modules you're subscribed to" checked={moduleUpdates} onChange={setModuleUpdates} />
                <Toggle label="Weekly digest" description="Summary of activity every Monday" checked={weeklyDigest} onChange={setWeeklyDigest} />
              </div>
            </SettingSection>
            <SettingSection title="Quiet Hours" description="Pause notifications during specific times.">
              <Toggle label="Enable quiet hours" description="Silence all notifications during the set period" checked={quietHoursEnabled} onChange={setQuietHoursEnabled} />
              {quietHoursEnabled && (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div><label className={labelClass}>Start time</label><input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className={selectClass} /></div>
                  <div><label className={labelClass}>End time</label><input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className={selectClass} /></div>
                </div>
              )}
            </SettingSection>
          </>)}

          {/* Security */}
          {activeSection === 'security' && (<>
            <SettingSection title="Authentication" description="Strengthen your account security.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="flex items-center justify-between py-3">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-white">Two-factor authentication</p><p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p></div>
                  <div className="flex items-center gap-2">
                    {twoFactorEnabled && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">Enabled</span>}
                    <button onClick={() => { if (twoFactorEnabled) setTwoFactorEnabled(false); else router.push('/2fa/setup'); }} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${twoFactorEnabled ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
                <Toggle label="Biometric login" description="Use fingerprint or face ID" checked={biometricLogin} onChange={setBiometricLogin} />
                <Toggle label="Login alerts" description="Email alert from new device" checked={loginAlerts} onChange={setLoginAlerts} />
                <Toggle label="IP whitelisting" description="Restrict to specific IPs" checked={ipWhitelisting} onChange={setIpWhitelisting} />
              </div>
            </SettingSection>
            <SettingSection title="Session Management" description="Control session behavior and expiry.">
              <Slider label="Session timeout" description="Auto-logout after inactivity" value={sessionTimeout} onChange={setSessionTimeout} min={5} max={120} unit=" min" />
              <div className="mt-4"><label className={labelClass}>Password expiry</label>
                <select value={passwordExpiry} onChange={(e) => setPasswordExpiry(e.target.value)} className={selectClass}>
                  <option value="30">Every 30 days</option><option value="60">Every 60 days</option><option value="90">Every 90 days</option><option value="180">Every 180 days</option><option value="never">Never</option>
                </select>
              </div>
            </SettingSection>
            <SettingSection title="Password" description="Update your account password.">
              <button onClick={() => router.push('/change-password')} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                Change Password
              </button>
            </SettingSection>
          </>)}

          {/* Privacy */}
          {activeSection === 'privacy' && (<>
            <SettingSection title="Profile Visibility" description="Control who can see your profile.">
              <div className="mb-4"><label className={labelClass}>Who can view your profile</label>
                <select value={profileVisibility} onChange={(e) => setProfileVisibility(e.target.value)} className={selectClass}>
                  <option value="everyone">Everyone in organization</option><option value="team">My team only</option><option value="private">Only me</option>
                </select>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Show email address" description="Display email on profile" checked={showEmail} onChange={setShowEmail} />
                <Toggle label="Show phone number" description="Display phone on profile" checked={showPhone} onChange={setShowPhone} />
                <Toggle label="Appear in search results" description="Allow others to find you" checked={searchable} onChange={setSearchable} />
              </div>
            </SettingSection>
            <SettingSection title="Activity & Status" description="Manage what others see about your activity.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Online activity status" description="Show when you're active" checked={activityStatus} onChange={setActivityStatus} />
                <Toggle label="Read receipts" description="Let others know you've seen messages" checked={readReceipts} onChange={setReadReceipts} />
              </div>
            </SettingSection>
            <SettingSection title="Data Usage" description="Control how your data is used.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Usage analytics" description="Share anonymized usage data" checked={analyticsOptIn} onChange={setAnalyticsOptIn} />
                <Toggle label="Third-party data sharing" description="Allow sharing with trusted partners" checked={dataSharing} onChange={setDataSharing} />
              </div>
            </SettingSection>
          </>)}

          {/* Language & Region */}
          {activeSection === 'language' && (<>
            <SettingSection title="Language" description="Set your preferred interface language.">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
                <option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="pt">Português</option><option value="ar">العربية</option><option value="zh">中文</option><option value="ja">日本語</option><option value="hi">हिन्दी</option><option value="ko">한국어</option><option value="it">Italiano</option><option value="nl">Nederlands</option><option value="ru">Русский</option><option value="tr">Türkçe</option>
              </select>
            </SettingSection>
            <SettingSection title="Timezone & Calendar" description="Configure date, time, and calendar preferences.">
              <div className="space-y-4">
                <div><label className={labelClass}>Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectClass}>
                    <option value="UTC">UTC</option><option value="America/New_York">Eastern Time</option><option value="America/Chicago">Central Time</option><option value="America/Denver">Mountain Time</option><option value="America/Los_Angeles">Pacific Time</option><option value="Europe/London">London (GMT)</option><option value="Europe/Paris">Paris (CET)</option><option value="Asia/Kolkata">India (IST)</option><option value="Asia/Tokyo">Tokyo (JST)</option><option value="Asia/Dubai">Dubai (GST)</option><option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
                <div><label className={labelClass}>First day of week</label>
                  <div className="flex gap-3">
                    {['sunday', 'monday', 'saturday'].map((day) => (
                      <button key={day} onClick={() => setFirstDayOfWeek(day)} className={`flex-1 rounded-lg border-2 px-3 py-2 text-center text-sm font-medium capitalize transition ${firstDayOfWeek === day ? btnActive : btnInactive}`}>{day}</button>
                    ))}
                  </div>
                </div>
              </div>
            </SettingSection>
            <SettingSection title="Formatting" description="Set how dates, times, numbers, and currency are displayed.">
              <div className="space-y-4">
                <div><label className={labelClass}>Date format</label>
                  <div className="flex flex-wrap gap-3">
                    {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((fmt) => (
                      <button key={fmt} onClick={() => setDateFormat(fmt)} className={`rounded-lg border-2 px-3 py-2 text-xs font-mono font-medium transition ${dateFormat === fmt ? btnActive : btnInactive}`}>{fmt}</button>
                    ))}
                  </div>
                </div>
                <div><label className={labelClass}>Time format</label>
                  <div className="flex gap-3">
                    {[{ key: '12h', label: '12 hour (3:30 PM)' }, { key: '24h', label: '24 hour (15:30)' }].map((f) => (
                      <button key={f.key} onClick={() => setTimeFormat(f.key)} className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${timeFormat === f.key ? btnActive : btnInactive}`}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className={labelClass}>Number format</label><select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} className={selectClass}><option value="1,000.00">1,000.00</option><option value="1.000,00">1.000,00</option><option value="1 000.00">1 000.00</option></select></div>
                  <div><label className={labelClass}>Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectClass}><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option><option value="INR">INR (₹)</option><option value="JPY">JPY (¥)</option><option value="AUD">AUD (A$)</option><option value="CAD">CAD (C$)</option><option value="AED">AED (د.إ)</option><option value="BRL">BRL (R$)</option><option value="SGD">SGD (S$)</option></select></div>
                </div>
              </div>
            </SettingSection>
          </>)}

          {/* Accessibility */}
          {activeSection === 'accessibility' && (<>
            <SettingSection title="Visual" description="Adjust visual settings for better readability.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="High contrast mode" description="Increase contrast for better visibility" checked={highContrast} onChange={setHighContrast} />
                <Toggle label="Increased text spacing" description="Add more space between letters and lines" checked={textSpacing} onChange={setTextSpacing} />
                <Toggle label="Focus indicators" description="Show visible outlines on focused elements" checked={focusIndicators} onChange={setFocusIndicators} />
              </div>
            </SettingSection>
            <SettingSection title="Interaction" description="Customize how you interact with the interface.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Keyboard navigation" description="Full interface navigation via keyboard" checked={keyboardNavigation} onChange={setKeyboardNavigation} />
                <Toggle label="Screen reader optimized" description="Optimize layout for screen readers" checked={screenReaderOptimized} onChange={setScreenReaderOptimized} />
                <Toggle label="Auto-play media" description="Automatically play videos and animations" checked={autoplayMedia} onChange={setAutoplayMedia} />
                <Toggle label="Closed captions" description="Show captions on video and audio content" checked={captionsEnabled} onChange={setCaptionsEnabled} />
              </div>
              <Slider label="Tooltip delay" description="Time before tooltips appear" value={tooltipDelay} onChange={setTooltipDelay} min={0} max={2000} unit="ms" />
            </SettingSection>
          </>)}

          {/* Data & Storage */}
          {activeSection === 'data' && (<>
            <SettingSection title="Storage Usage" description="Monitor your data storage consumption.">
              <div className="mb-4">
                <div className="mb-2 flex items-end justify-between">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{storageUsed} GB</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">of {storageTotal} GB used</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${(storageUsed / storageTotal) * 100}%` }} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[{ label: 'Documents', size: '1.2 GB', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }, { label: 'Media', size: '0.8 GB', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }, { label: 'Other', size: '0.4 GB', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' }].map((item) => (
                  <div key={item.label} className={`rounded-xl px-3 py-2.5 text-center ${item.color}`}><p className="text-xs font-medium">{item.label}</p><p className="text-sm font-bold">{item.size}</p></div>
                ))}
              </div>
            </SettingSection>
            <SettingSection title="Auto-Save" description="Automatically save your work at regular intervals.">
              <Toggle label="Enable auto-save" description="Automatically save unsaved changes" checked={autoSave} onChange={setAutoSave} />
              {autoSave && <Slider label="Save interval" description="How often to auto-save" value={autoSaveInterval} onChange={setAutoSaveInterval} min={1} max={30} unit=" min" />}
            </SettingSection>
            <SettingSection title="Cache & Offline" description="Manage cached data and offline access.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="Enable caching" description="Cache data locally for faster loading" checked={cacheEnabled} onChange={setCacheEnabled} />
                <Toggle label="Offline mode" description="Access recently viewed data without internet" checked={offlineMode} onChange={setOfflineMode} />
              </div>
              <div className="mt-4"><button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">Clear Cache</button></div>
            </SettingSection>
            <SettingSection title="Export Data" description="Download your data in various formats.">
              <div className="mb-4"><label className={labelClass}>Export format</label>
                <div className="flex flex-wrap gap-3">
                  {['csv', 'json', 'xlsx', 'pdf'].map((fmt) => (
                    <button key={fmt} onClick={() => setExportFormat(fmt)} className={`rounded-lg border-2 px-4 py-2 text-xs font-mono font-medium uppercase transition ${exportFormat === fmt ? btnActive : btnInactive}`}>.{fmt}</button>
                  ))}
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                Export All Data
              </button>
            </SettingSection>
          </>)}

          {/* Integrations */}
          {activeSection === 'integrations' && (<>
            <SettingSection title="Connected Apps" description="Manage third-party service integrations.">
              <div className="space-y-3">
                {[
                  { name: 'Slack', desc: 'Receive notifications in Slack', connected: slackConnected, toggle: setSlackConnected, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
                  { name: 'Google Workspace', desc: 'Sync calendar, contacts, drive', connected: googleConnected, toggle: setGoogleConnected, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                  { name: 'Microsoft 365', desc: 'Teams, Outlook, OneDrive', connected: microsoftConnected, toggle: setMicrosoftConnected, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                  { name: 'Jira', desc: 'Sync issues and projects', connected: jiraConnected, toggle: setJiraConnected, color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
                  { name: 'GitHub', desc: 'Link repos and PRs', connected: githubConnected, toggle: setGithubConnected, color: 'bg-gray-800 text-white dark:bg-gray-700' },
                  { name: 'Zapier', desc: 'Automate workflows', connected: zapierConnected, toggle: setZapierConnected, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                ].map((app) => (
                  <div key={app.name} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${app.color}`}>{app.name.charAt(0)}</span>
                      <div><p className="text-sm font-medium text-gray-900 dark:text-white">{app.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{app.desc}</p></div>
                    </div>
                    <button onClick={() => app.toggle(!app.connected)} className={`shrink-0 self-start rounded-lg border px-3 py-1.5 text-xs font-semibold transition sm:self-auto ${app.connected ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {app.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </SettingSection>
            <SettingSection title="API & Webhooks" description="Developer integrations and automation.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <Toggle label="API access" description="Allow external apps to access data via API" checked={apiAccess} onChange={setApiAccess} />
                <Toggle label="Webhooks" description="Send real-time events to external URLs" checked={webhooksEnabled} onChange={setWebhooksEnabled} />
              </div>
              {apiAccess && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">API Key</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-700">sk-••••••••••••••••••••••••••••4f2a</code>
                    <button className="shrink-0 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 sm:self-auto dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">Regenerate</button>
                  </div>
                </div>
              )}
            </SettingSection>
          </>)}

          {/* Keyboard Shortcuts */}
          {activeSection === 'keyboard' && (
            <SettingSection title="Keyboard Shortcuts" description="Quick reference for available shortcuts.">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{s.action}</p>
                    <div className="flex items-center gap-1">
                      {s.keys.map((key, j) => (
                        <span key={j}>
                          <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">{key}</kbd>
                          {j < s.keys.length - 1 && <span className="mx-0.5 text-xs text-gray-400">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SettingSection>
          )}

          {/* Danger Zone */}
          {activeSection === 'danger' && (
            <SettingSection title="Danger Zone" description="These actions are irreversible. Proceed with caution.">
              <div className="space-y-3">
                {[
                  { title: 'Clear all notifications', desc: 'Remove all notification history permanently.', level: 'amber' as const, btn: 'Clear' },
                  { title: 'Reset all settings', desc: 'Restore all settings to their default values.', level: 'amber' as const, btn: 'Reset' },
                  { title: 'Delete all data', desc: 'Permanently erase all your personal data.', level: 'red' as const, btn: 'Delete Data' },
                  { title: 'Deactivate account', desc: 'Temporarily disable your account.', level: 'red' as const, btn: 'Deactivate' },
                ].map((item) => (
                  <div key={item.title} className={`flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${item.level === 'amber' ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/20' : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/20'}`}>
                    <div>
                      <p className={`text-sm font-medium ${item.level === 'amber' ? 'text-amber-900 dark:text-amber-300' : 'text-red-900 dark:text-red-300'}`}>{item.title}</p>
                      <p className={`text-xs ${item.level === 'amber' ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{item.desc}</p>
                    </div>
                    <button className={`shrink-0 self-start rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${item.level === 'amber' ? 'border-amber-300 bg-white text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-gray-900 dark:text-amber-400' : 'border-red-300 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400'}`}>{item.btn}</button>
                  </div>
                ))}
                <div className="flex flex-col gap-3 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-800 dark:bg-red-900/30">
                  <div>
                    <p className="text-sm font-bold text-red-900 dark:text-red-300">Delete account permanently</p>
                    <p className="text-xs text-red-600 dark:text-red-400">This action cannot be undone. All data will be lost forever.</p>
                  </div>
                  <button className="shrink-0 self-start rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700">Delete Account</button>
                </div>
              </div>
            </SettingSection>
          )}
        </div>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-14 z-50 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:bottom-0 md:px-6 dark:border-gray-800 dark:bg-gray-950/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">You have unsaved changes</p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setDirty(false); window.location.reload(); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Discard</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
