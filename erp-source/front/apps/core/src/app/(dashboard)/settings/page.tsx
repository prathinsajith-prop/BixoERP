'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useTheme, showToast } from '@erp/shell';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Select, Input, Button } from '@erp/ui';

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

function Toggle({
  label,
  description,
  checked,
  onChange,
  divider = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  divider?: boolean;
}) {
  return (
    <label
      className="flex cursor-pointer items-center justify-between gap-4 py-3"
      style={divider ? { borderTop: '1px solid var(--gogo-divider)' } : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>{label}</p>
        {description && <p className="mt-0.5 text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-all focus:outline-none focus-visible:ring-2"
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          backgroundColor: checked ? 'var(--gogo-primary)' : 'var(--gogo-grey-100)',
          border: '2px solid',
          borderColor: checked ? 'var(--gogo-primary)' : 'var(--gogo-divider)',
        }}
      >
        <span
          className="absolute top-0.5 block h-4 w-4 rounded-full shadow-sm transition-all"
          style={{
            left: checked ? 'calc(100% - 18px)' : 2,
            backgroundColor: checked ? '#ffffff' : 'var(--gogo-text-secondary)',
          }}
        />
      </button>
    </label>
  );
}

function CustomSlider({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '',
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>{label}</p>
          {description && <p className="mt-0.5 text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>{description}</p>}
        </div>
        <span
          className="shrink-0 rounded-[var(--radius-chip)] px-2.5 py-1 text-xs font-bold"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)',
            color: 'var(--gogo-primary)',
            minWidth: '3rem',
            textAlign: 'center',
          }}
        >
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <div className="relative h-2 w-full overflow-hidden" style={{ borderRadius: 999, backgroundColor: 'var(--gogo-grey-100)' }}>
          <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--gogo-primary)', borderRadius: 999 }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ margin: 0 }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-md transition-all"
          style={{
            left: `calc(${pct}% - 10px)`,
            backgroundColor: 'var(--gogo-surface)',
            border: '2.5px solid var(--gogo-primary)',
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px]" style={{ color: 'var(--gogo-text-secondary)' }}>{min}{unit}</span>
        <span className="text-[10px]" style={{ color: 'var(--gogo-text-secondary)' }}>{max}{unit}</span>
      </div>
    </div>
  );
}

function SettingSection({
  title,
  description,
  icon,
  children,
  variant = 'default',
}: {
  title: string;
  description: string;
  icon?: string;
  children: ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <div
      className="overflow-hidden"
      style={{
        backgroundColor: 'var(--gogo-surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        border: variant === 'danger' ? '1px solid rgba(220,38,38,0.2)' : '1px solid var(--gogo-divider)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4" style={{ borderBottom: '1px solid var(--gogo-divider)' }}>
        {icon && (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-chip)]"
            style={{
              backgroundColor: variant === 'danger' ? 'rgba(220,38,38,0.1)' : 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)',
              color: variant === 'danger' ? '#dc2626' : 'var(--gogo-primary)',
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--gogo-text-primary)' }}>{title}</h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>{description}</p>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </div>
  );
}

function SettingsSidebar({
  active,
  onChange,
  sectionCounts,
}: {
  active: string;
  onChange: (key: string) => void;
  sectionCounts: Record<string, number>;
}) {
  const GROUPS = [
    {
      label: 'Preferences',
      items: SIDEBAR_ITEMS.filter(i => ['appearance', 'notifications', 'language', 'accessibility'].includes(i.key)),
    },
    {
      label: 'Account',
      items: SIDEBAR_ITEMS.filter(i => ['security', 'privacy', 'data', 'integrations'].includes(i.key)),
    },
    {
      label: 'System',
      items: SIDEBAR_ITEMS.filter(i => ['keyboard', 'danger'].includes(i.key)),
    },
  ];

  return (
    <nav className="space-y-5">
      {GROUPS.map(group => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--gogo-text-secondary)' }}>
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(item => {
              const isActive = active === item.key;
              const isDanger = item.key === 'danger';
              const count = sectionCounts[item.key] ?? 0;
              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  className="relative flex w-full items-center gap-3 rounded-[var(--radius-button)] px-3 py-2.5 text-left text-sm transition-all"
                  style={{
                    backgroundColor: isActive ? 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)' : 'transparent',
                    color: isActive ? 'var(--gogo-primary)' : isDanger ? '#dc2626' : 'var(--gogo-text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                      style={{ width: 3, height: '60%', backgroundColor: 'var(--gogo-primary)' }}
                    />
                  )}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-chip)]"
                    style={{
                      backgroundColor: isActive ? 'color-mix(in srgb, var(--gogo-primary) 15%, transparent)' : 'var(--gogo-grey-100)',
                    }}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span
                      className="flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                      style={{
                        backgroundColor: isActive ? 'var(--gogo-primary)' : 'var(--gogo-grey-100)',
                        color: isActive ? '#ffffff' : 'var(--gogo-text-secondary)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                  {isDanger && count === 0 && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function SettingsPage() {
  const router = useRouter();
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
  useEffect(() => { authApi.twoFactorStatus().then(({ data }: { data: any }) => setTwoFactorEnabled(data.data.enabled)).catch(() => { }); }, []);
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
    authApi.getSettings().then(({ data }: { data: any }) => { if (data.data) applySettings(data.data); }).catch(() => { }).finally(() => { loadedRef.current = true; });
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
    setSaving(true);
    try {
      await authApi.updateSettings(buildPayload());
      setDirty(false);
      showToast.success('Settings saved');
    } catch (err: any) {
      showToast.error('Something went wrong', err.response?.data?.message ?? 'Failed to save settings.');
    } finally { setSaving(false); }
  };

  const ACCENT_COLORS = [
    { key: 'blue', label: 'Blue', hex: '#3b82f6', tw: 'bg-blue-500' },
    { key: 'indigo', label: 'Indigo', hex: '#6366f1', tw: 'bg-indigo-500' },
    { key: 'purple', label: 'Purple', hex: '#922c88', tw: 'bg-purple-500' },
    { key: 'pink', label: 'Pink', hex: '#ec4899', tw: 'bg-pink-500' },
    { key: 'red', label: 'Red', hex: '#ef4444', tw: 'bg-red-500' },
    { key: 'orange', label: 'Orange', hex: '#f97316', tw: 'bg-orange-500' },
    { key: 'amber', label: 'Amber', hex: '#f59e0b', tw: 'bg-amber-500' },
    { key: 'emerald', label: 'Green', hex: '#10b981', tw: 'bg-emerald-500' },
    { key: 'teal', label: 'Teal', hex: '#14b8a6', tw: 'bg-teal-500' },
    { key: 'cyan', label: 'Cyan', hex: '#06b6d4', tw: 'bg-cyan-500' },
  ];

  const THEMES = [
    {
      key: 'light',
      label: 'Light',
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>,
      preview: { bg: '#ffffff', text: '#2b2b2b' },
    },
    {
      key: 'dark',
      label: 'Dark',
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>,
      preview: { bg: '#1e1e1e', text: '#ffffff' },
    },
    {
      key: 'system',
      label: 'System',
      icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>,
      preview: { bg: 'linear-gradient(135deg, #ffffff 50%, #1e1e1e 50%)', text: '#2b2b2b' },
    },
  ];

  const storageUsed = 2.4, storageTotal = 10;

  const btnActive = {
    border: '2px solid var(--gogo-primary)',
    backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)',
    color: 'var(--gogo-primary)',
    fontWeight: 600,
  };

  const btnInactive = {
    border: '2px solid var(--gogo-divider)',
    backgroundColor: 'var(--gogo-surface)',
    color: 'var(--gogo-text-secondary)',
  };

  const sectionCounts: Record<string, number> = {
    appearance: [accentColor !== 'purple', compactMode, !animationsEnabled].filter(Boolean).length,
    notifications: [!emailNotifs, !pushNotifs, quietHoursEnabled].filter(Boolean).length,
    security: [twoFactorEnabled, loginAlerts, ipWhitelisting].filter(Boolean).length,
    privacy: [!showEmail, !searchable, !activityStatus, !readReceipts].filter(Boolean).length,
    integrations: [slackConnected, googleConnected, microsoftConnected, jiraConnected, githubConnected].filter(Boolean).length,
  };

  return (
    <>
      {/* Dynamic settings header */}
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--gogo-text-secondary)' }}>
          <span>Settings</span>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          <span style={{ color: 'var(--gogo-primary)', fontWeight: 600 }}>
            {SIDEBAR_ITEMS.find(i => i.key === activeSection)?.label ?? 'Appearance'}
          </span>
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--gogo-text-primary)', fontFamily: 'var(--font-gogo)' }}>
          {SIDEBAR_ITEMS.find(i => i.key === activeSection)?.label ?? 'Settings'}
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>
          {(() => {
            const descriptions: Record<string, string> = {
              appearance: 'Customize how BixoERP looks and feels',
              notifications: 'Control when and how you get notified',
              security: 'Protect your account and data',
              privacy: 'Manage what others can see about you',
              language: 'Set your preferred language, timezone and formats',
              accessibility: 'Adapt the interface to your needs',
              data: 'Manage your storage, exports and cache',
              integrations: 'Connect third-party apps and APIs',
              keyboard: 'Reference for keyboard shortcuts',
              danger: 'Irreversible actions — proceed with caution',
            };
            return descriptions[activeSection] ?? 'Customize your preferences';
          })()}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Desktop sidebar */}
        <aside
          className="sticky hidden h-fit w-56 shrink-0 overflow-y-auto lg:block"
          style={{
            top: 'calc(var(--gogo-header-height) + 1.5rem)',
            backgroundColor: 'var(--gogo-surface)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--gogo-divider)',
            padding: '12px',
          }}
        >
          <SettingsSidebar active={activeSection} onChange={setActiveSection} sectionCounts={sectionCounts} />
        </aside>

        {/* Mobile section picker */}
        <div className="relative mb-4 w-full lg:hidden">
          {(() => {
            const active = SIDEBAR_ITEMS.find((i) => i.key === activeSection);
            return (
              <>
                <button
                  onClick={() => setMobileSectionOpen((o) => !o)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition"
                  style={{
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--gogo-divider)',
                    backgroundColor: 'var(--gogo-surface)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--gogo-text-secondary)' }}><path strokeLinecap="round" strokeLinejoin="round" d={active?.icon} /></svg>
                    <span className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>{active?.label}</span>
                  </span>
                  <svg className={`h-4 w-4 transition-transform ${mobileSectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--gogo-text-secondary)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </button>
                {mobileSectionOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setMobileSectionOpen(false)} />
                    <div
                      className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto py-1"
                      style={{ borderRadius: 'var(--radius-card)', border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-surface)', boxShadow: 'var(--shadow-hover)' }}
                    >
                      {SIDEBAR_ITEMS.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => { setActiveSection(item.key); setMobileSectionOpen(false); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition"
                          style={activeSection === item.key ? { backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)', color: 'var(--gogo-primary)' } : { color: 'var(--gogo-text-primary)' }}
                        >
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                          {item.label}
                          {item.key === 'danger' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-500" />}
                          {activeSection === item.key && <svg className="ml-auto h-4 w-4" style={{ color: 'var(--gogo-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="space-y-6">

            {/* Appearance */}
            {activeSection === 'appearance' && (<>
              <SettingSection title="Theme" description="Choose your preferred color scheme." icon={SIDEBAR_ITEMS[0].icon}>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(t => {
                    const isActive = theme === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setTheme(t.key)}
                        className="group relative overflow-hidden transition-all"
                        style={{
                          borderRadius: 'var(--radius-input)',
                          border: isActive ? '2px solid var(--gogo-primary)' : '2px solid var(--gogo-divider)',
                          backgroundColor: isActive ? 'color-mix(in srgb, var(--gogo-primary) 5%, var(--gogo-surface))' : 'var(--gogo-surface)',
                          boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                        }}
                      >
                        <div className="h-14 w-full" style={{ background: t.preview.bg }}>
                          <div className="flex h-full items-end px-3 pb-2 gap-1">
                            <div className="h-1.5 w-8 rounded-full opacity-40" style={{ backgroundColor: t.preview.text }} />
                            <div className="h-1 w-5 rounded-full opacity-20" style={{ backgroundColor: t.preview.text }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <span style={{ color: isActive ? 'var(--gogo-primary)' : 'var(--gogo-text-secondary)' }}>{t.icon}</span>
                          <span className="text-sm font-semibold" style={{ color: isActive ? 'var(--gogo-primary)' : 'var(--gogo-text-primary)' }}>{t.label}</span>
                          {isActive && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--gogo-primary)' }}>
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SettingSection>

              <SettingSection title="Accent Color" description="Personalize the primary color across the interface." icon={SIDEBAR_ITEMS[0].icon}>
                <div className="grid grid-cols-5 gap-2">
                  {ACCENT_COLORS.map(c => {
                    const isActive = accentColor === c.key;
                    return (
                      <button
                        key={c.key}
                        onClick={() => setAccentColor(c.key)}
                        className="flex flex-col items-center gap-1.5 p-2 transition-all"
                        style={{
                          borderRadius: 'var(--radius-input)',
                          border: isActive ? `2px solid ${c.hex}` : '2px solid transparent',
                          backgroundColor: isActive ? `${c.hex}14` : 'transparent',
                        }}
                        title={c.label}
                      >
                        <span className={`relative flex h-8 w-8 items-center justify-center rounded-full ${c.tw}`}>
                          {isActive && (
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          )}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: isActive ? c.hex : 'var(--gogo-text-secondary)' }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </SettingSection>

              <SettingSection title="Layout & Display" description="Adjust the interface density and behavior." icon={SIDEBAR_ITEMS[0].icon}>
                <CustomSlider label="Font size" description="Adjust the base text size" value={fontSize} onChange={setFontSize} min={10} max={20} unit="px" />
                <Toggle label="Compact mode" description="Reduce spacing and padding" checked={compactMode} onChange={setCompactMode} divider />
                <Toggle label="Animations" description="Enable transitions and motion effects" checked={animationsEnabled} onChange={setAnimationsEnabled} divider />
                <Toggle label="Reduced motion" description="Minimize non-essential movement" checked={reducedMotion} onChange={setReducedMotion} divider />
              </SettingSection>
            </>)}

            {/* Notifications */}
            {activeSection === 'notifications' && (<>
              <SettingSection title="Channels" description="Control how you receive notifications." icon={SIDEBAR_ITEMS[1].icon}>
                <Toggle label="Email notifications" description="Receive important updates via email" checked={emailNotifs} onChange={setEmailNotifs} />
                <Toggle label="Push notifications" description="Get real-time alerts in your browser" checked={pushNotifs} onChange={setPushNotifs} divider />
                <Toggle label="Desktop notifications" description="Show native desktop notification popups" checked={desktopNotifs} onChange={setDesktopNotifs} divider />
                <Toggle label="Sound alerts" description="Play a sound for incoming notifications" checked={soundEnabled} onChange={setSoundEnabled} divider />
                {soundEnabled && (
                  <div className="mt-4">
                    <Select label="Notification sound" value={notifSound} onChange={(e) => setNotifSound(e.target.value)} options={[{ value: 'default', label: 'Default' }, { value: 'chime', label: 'Chime' }, { value: 'ping', label: 'Ping' }, { value: 'pop', label: 'Pop' }, { value: 'bell', label: 'Bell' }, { value: 'none', label: 'None' }]} />
                  </div>
                )}
              </SettingSection>
              <SettingSection title="Activity Types" description="Choose which events trigger notifications." icon={SIDEBAR_ITEMS[1].icon}>
                <Toggle label="@Mentions" description="When someone mentions you" checked={mentionNotifs} onChange={setMentionNotifs} />
                <Toggle label="Task assignments" description="When a task is assigned to you" checked={taskNotifs} onChange={setTaskNotifs} divider />
                <Toggle label="Module updates" description="Changes in modules you're subscribed to" checked={moduleUpdates} onChange={setModuleUpdates} divider />
                <Toggle label="Weekly digest" description="Summary of activity every Monday" checked={weeklyDigest} onChange={setWeeklyDigest} divider />
              </SettingSection>
              <SettingSection title="Quiet Hours" description="Pause notifications during specific times." icon={SIDEBAR_ITEMS[1].icon}>
                <Toggle label="Enable quiet hours" description="Silence all notifications during the set period" checked={quietHoursEnabled} onChange={setQuietHoursEnabled} />
                {quietHoursEnabled && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <Input type="time" label="Start time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
                    <Input type="time" label="End time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
                  </div>
                )}
              </SettingSection>
            </>)}

            {/* Security */}
            {activeSection === 'security' && (<>
              <SettingSection title="Authentication" description="Strengthen your account security." icon={SIDEBAR_ITEMS[2].icon}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>Two-factor authentication</p>
                    <p className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {twoFactorEnabled && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669' }}>Enabled</span>
                    )}
                    <button
                      onClick={() => { if (twoFactorEnabled) setTwoFactorEnabled(false); else router.push('/2fa/setup'); }}
                      className="rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold transition"
                      style={twoFactorEnabled
                        ? { border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.05)' }
                        : { border: '1px solid var(--gogo-primary)', color: 'var(--gogo-primary)', backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)' }}
                    >
                      {twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
                <Toggle label="Biometric login" description="Use fingerprint or face ID" checked={biometricLogin} onChange={setBiometricLogin} divider />
                <Toggle label="Login alerts" description="Email alert from new device" checked={loginAlerts} onChange={setLoginAlerts} divider />
                <Toggle label="IP whitelisting" description="Restrict to specific IPs" checked={ipWhitelisting} onChange={setIpWhitelisting} divider />
              </SettingSection>
              <SettingSection title="Session Management" description="Control session behavior and expiry." icon={SIDEBAR_ITEMS[2].icon}>
                <CustomSlider label="Session timeout" description="Auto-logout after inactivity" value={sessionTimeout} onChange={setSessionTimeout} min={5} max={120} unit=" min" />
                <div className="mt-4">
                  <Select label="Password expiry" value={passwordExpiry} onChange={(e) => setPasswordExpiry(e.target.value)} options={[{ value: '30', label: 'Every 30 days' }, { value: '60', label: 'Every 60 days' }, { value: '90', label: 'Every 90 days' }, { value: '180', label: 'Every 180 days' }, { value: 'never', label: 'Never' }]} />
                </div>
              </SettingSection>
              <SettingSection title="Password" description="Update your account password." icon={SIDEBAR_ITEMS[2].icon}>
                <button
                  onClick={() => router.push('/change-password')}
                  className="flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-medium transition"
                  style={{ border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-primary)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-surface)')}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                  Change Password
                </button>
              </SettingSection>
            </>)}

            {/* Privacy */}
            {activeSection === 'privacy' && (<>
              <SettingSection title="Profile Visibility" description="Control who can see your profile." icon={SIDEBAR_ITEMS[3].icon}>
                <div className="mb-4">
                  <Select label="Who can view your profile" value={profileVisibility} onChange={(e) => setProfileVisibility(e.target.value)} options={[{ value: 'everyone', label: 'Everyone in organization' }, { value: 'team', label: 'My team only' }, { value: 'private', label: 'Only me' }]} />
                </div>
                <Toggle label="Show email address" description="Display email on profile" checked={showEmail} onChange={setShowEmail} />
                <Toggle label="Show phone number" description="Display phone on profile" checked={showPhone} onChange={setShowPhone} divider />
                <Toggle label="Appear in search results" description="Allow others to find you" checked={searchable} onChange={setSearchable} divider />
              </SettingSection>
              <SettingSection title="Activity & Status" description="Manage what others see about your activity." icon={SIDEBAR_ITEMS[3].icon}>
                <Toggle label="Online activity status" description="Show when you're active" checked={activityStatus} onChange={setActivityStatus} />
                <Toggle label="Read receipts" description="Let others know you've seen messages" checked={readReceipts} onChange={setReadReceipts} divider />
              </SettingSection>
              <SettingSection title="Data Usage" description="Control how your data is used." icon={SIDEBAR_ITEMS[3].icon}>
                <Toggle label="Usage analytics" description="Share anonymized usage data" checked={analyticsOptIn} onChange={setAnalyticsOptIn} />
                <Toggle label="Third-party data sharing" description="Allow sharing with trusted partners" checked={dataSharing} onChange={setDataSharing} divider />
              </SettingSection>
            </>)}

            {/* Language & Region */}
            {activeSection === 'language' && (<>
              <SettingSection title="Language" description="Set your preferred interface language." icon={SIDEBAR_ITEMS[4].icon}>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Espanol' }, { value: 'fr', label: 'Francais' }, { value: 'de', label: 'Deutsch' }, { value: 'pt', label: 'Portugues' }, { value: 'ar', label: 'Arabic' }, { value: 'zh', label: 'Chinese' }, { value: 'ja', label: 'Japanese' }, { value: 'hi', label: 'Hindi' }, { value: 'ko', label: 'Korean' }, { value: 'it', label: 'Italiano' }, { value: 'nl', label: 'Nederlands' }, { value: 'ru', label: 'Russian' }, { value: 'tr', label: 'Turkce' }]} />
              </SettingSection>
              <SettingSection title="Timezone & Calendar" description="Configure date, time, and calendar preferences." icon={SIDEBAR_ITEMS[4].icon}>
                <div className="space-y-4">
                  <Select label="Timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} options={[{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern Time' }, { value: 'America/Chicago', label: 'Central Time' }, { value: 'America/Denver', label: 'Mountain Time' }, { value: 'America/Los_Angeles', label: 'Pacific Time' }, { value: 'Europe/London', label: 'London (GMT)' }, { value: 'Europe/Paris', label: 'Paris (CET)' }, { value: 'Asia/Kolkata', label: 'India (IST)' }, { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }, { value: 'Asia/Dubai', label: 'Dubai (GST)' }, { value: 'Australia/Sydney', label: 'Sydney (AEST)' }]} />
                  <div>
                    <p className="mb-1.5 text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>First day of week</p>
                    <div className="flex gap-3">
                      {['sunday', 'monday', 'saturday'].map((day) => (
                        <button key={day} onClick={() => setFirstDayOfWeek(day)} className="flex-1 rounded-[var(--radius-button)] px-3 py-2 text-center text-sm font-medium capitalize transition" style={firstDayOfWeek === day ? btnActive : btnInactive}>{day}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </SettingSection>
              <SettingSection title="Formatting" description="Set how dates, times, numbers, and currency are displayed." icon={SIDEBAR_ITEMS[4].icon}>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>Date format</p>
                    <div className="flex flex-wrap gap-3">
                      {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((fmt) => (
                        <button key={fmt} onClick={() => setDateFormat(fmt)} className="rounded-[var(--radius-button)] px-3 py-2 text-xs font-mono font-medium transition" style={dateFormat === fmt ? btnActive : btnInactive}>{fmt}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>Time format</p>
                    <div className="flex gap-3">
                      {[{ key: '12h', label: '12 hour (3:30 PM)' }, { key: '24h', label: '24 hour (15:30)' }].map((f) => (
                        <button key={f.key} onClick={() => setTimeFormat(f.key)} className="flex-1 rounded-[var(--radius-button)] px-3 py-2 text-sm font-medium transition" style={timeFormat === f.key ? btnActive : btnInactive}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select label="Number format" value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)} options={[{ value: '1,000.00', label: '1,000.00' }, { value: '1.000,00', label: '1.000,00' }, { value: '1 000.00', label: '1 000.00' }]} />
                    <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }, { value: 'INR', label: 'INR' }, { value: 'JPY', label: 'JPY' }, { value: 'AUD', label: 'AUD' }, { value: 'CAD', label: 'CAD' }, { value: 'AED', label: 'AED' }, { value: 'BRL', label: 'BRL' }, { value: 'SGD', label: 'SGD' }]} />
                  </div>
                </div>
              </SettingSection>
            </>)}

            {/* Accessibility */}
            {activeSection === 'accessibility' && (<>
              <SettingSection title="Visual" description="Adjust visual settings for better readability." icon={SIDEBAR_ITEMS[5].icon}>
                <Toggle label="High contrast mode" description="Increase contrast for better visibility" checked={highContrast} onChange={setHighContrast} />
                <Toggle label="Increased text spacing" description="Add more space between letters and lines" checked={textSpacing} onChange={setTextSpacing} divider />
                <Toggle label="Focus indicators" description="Show visible outlines on focused elements" checked={focusIndicators} onChange={setFocusIndicators} divider />
              </SettingSection>
              <SettingSection title="Interaction" description="Customize how you interact with the interface." icon={SIDEBAR_ITEMS[5].icon}>
                <Toggle label="Keyboard navigation" description="Full interface navigation via keyboard" checked={keyboardNavigation} onChange={setKeyboardNavigation} />
                <Toggle label="Screen reader optimized" description="Optimize layout for screen readers" checked={screenReaderOptimized} onChange={setScreenReaderOptimized} divider />
                <Toggle label="Auto-play media" description="Automatically play videos and animations" checked={autoplayMedia} onChange={setAutoplayMedia} divider />
                <Toggle label="Closed captions" description="Show captions on video and audio content" checked={captionsEnabled} onChange={setCaptionsEnabled} divider />
                <CustomSlider label="Tooltip delay" description="Time before tooltips appear" value={tooltipDelay} onChange={setTooltipDelay} min={0} max={2000} unit="ms" />
              </SettingSection>
            </>)}

            {/* Data & Storage */}
            {activeSection === 'data' && (<>
              <SettingSection title="Storage Usage" description="Monitor your data storage consumption." icon={SIDEBAR_ITEMS[6].icon}>
                <div className="mb-4">
                  <div className="mb-2 flex items-end justify-between">
                    <p className="text-2xl font-bold" style={{ color: 'var(--gogo-text-primary)' }}>{storageUsed} GB</p>
                    <p className="text-sm" style={{ color: 'var(--gogo-text-secondary)' }}>of {storageTotal} GB used</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--gogo-grey-100)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(storageUsed / storageTotal) * 100}%`, backgroundColor: 'var(--gogo-primary)' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Documents', size: '1.2 GB', bg: 'color-mix(in srgb, var(--gogo-primary) 10%, transparent)', color: 'var(--gogo-primary)' },
                    { label: 'Media', size: '0.8 GB', bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
                    { label: 'Other', size: '0.4 GB', bg: 'var(--gogo-grey-100)', color: 'var(--gogo-text-secondary)' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[var(--radius-button)] px-3 py-2.5 text-center" style={{ backgroundColor: item.bg }}>
                      <p className="text-xs font-medium" style={{ color: item.color }}>{item.label}</p>
                      <p className="text-sm font-bold" style={{ color: item.color }}>{item.size}</p>
                    </div>
                  ))}
                </div>
              </SettingSection>
              <SettingSection title="Auto-Save" description="Automatically save your work at regular intervals." icon={SIDEBAR_ITEMS[6].icon}>
                <Toggle label="Enable auto-save" description="Automatically save unsaved changes" checked={autoSave} onChange={setAutoSave} />
                {autoSave && <CustomSlider label="Save interval" description="How often to auto-save" value={autoSaveInterval} onChange={setAutoSaveInterval} min={1} max={30} unit=" min" />}
              </SettingSection>
              <SettingSection title="Cache & Offline" description="Manage cached data and offline access." icon={SIDEBAR_ITEMS[6].icon}>
                <Toggle label="Enable caching" description="Cache data locally for faster loading" checked={cacheEnabled} onChange={setCacheEnabled} />
                <Toggle label="Offline mode" description="Access recently viewed data without internet" checked={offlineMode} onChange={setOfflineMode} divider />
                <div className="mt-4">
                  <button
                    className="rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold transition"
                    style={{ border: '1px solid var(--gogo-divider)', color: 'var(--gogo-text-secondary)', backgroundColor: 'var(--gogo-surface)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-surface)')}
                  >Clear Cache</button>
                </div>
              </SettingSection>
              <SettingSection title="Export Data" description="Download your data in various formats." icon={SIDEBAR_ITEMS[6].icon}>
                <div className="mb-4">
                  <p className="mb-1.5 text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>Export format</p>
                  <div className="flex flex-wrap gap-3">
                    {['csv', 'json', 'xlsx', 'pdf'].map((fmt) => (
                      <button key={fmt} onClick={() => setExportFormat(fmt)} className="rounded-[var(--radius-button)] px-4 py-2 text-xs font-mono font-medium uppercase transition" style={exportFormat === fmt ? btnActive : btnInactive}>.{fmt}</button>
                    ))}
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--gogo-primary)' }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                  Export All Data
                </button>
              </SettingSection>
            </>)}

            {/* Integrations */}
            {activeSection === 'integrations' && (<>
              <SettingSection title="Connected Apps" description="Manage third-party service integrations." icon={SIDEBAR_ITEMS[7].icon}>
                <div className="space-y-3">
                  {[
                    { name: 'Slack', desc: 'Receive notifications in Slack', connected: slackConnected, toggle: setSlackConnected, bg: 'color-mix(in srgb, #922c88 10%, transparent)', color: '#922c88' },
                    { name: 'Google Workspace', desc: 'Sync calendar, contacts, drive', connected: googleConnected, toggle: setGoogleConnected, bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
                    { name: 'Microsoft 365', desc: 'Teams, Outlook, OneDrive', connected: microsoftConnected, toggle: setMicrosoftConnected, bg: 'rgba(59,130,246,0.1)', color: '#2563eb' },
                    { name: 'Jira', desc: 'Sync issues and projects', connected: jiraConnected, toggle: setJiraConnected, bg: 'rgba(14,165,233,0.1)', color: '#0284c7' },
                    { name: 'GitHub', desc: 'Link repos and PRs', connected: githubConnected, toggle: setGithubConnected, bg: 'var(--gogo-grey-100)', color: 'var(--gogo-text-primary)' },
                    { name: 'Zapier', desc: 'Automate workflows', connected: zapierConnected, toggle: setZapierConnected, bg: 'rgba(249,115,22,0.1)', color: '#ea580c' },
                  ].map((app) => (
                    <div
                      key={app.name}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-button)] p-3 sm:p-4 transition"
                      style={{ border: '1px solid var(--gogo-divider)' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold" style={{ backgroundColor: app.bg, color: app.color }}>{app.name.charAt(0)}</span>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>{app.name}</p>
                          <p className="text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>{app.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => app.toggle(!app.connected)}
                        className="shrink-0 rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold transition"
                        style={app.connected
                          ? { border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.05)' }
                          : { border: '1px solid var(--gogo-primary)', color: 'var(--gogo-primary)', backgroundColor: 'color-mix(in srgb, var(--gogo-primary) 8%, transparent)' }}
                      >
                        {app.connected ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              </SettingSection>
              <SettingSection title="API & Webhooks" description="Developer integrations and automation." icon={SIDEBAR_ITEMS[7].icon}>
                <Toggle label="API access" description="Allow external apps to access data via API" checked={apiAccess} onChange={setApiAccess} />
                <Toggle label="Webhooks" description="Send real-time events to external URLs" checked={webhooksEnabled} onChange={setWebhooksEnabled} divider />
                {apiAccess && (
                  <div className="mt-4 rounded-[var(--radius-button)] p-4" style={{ border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-grey-100)' }}>
                    <p className="mb-1 text-xs font-medium" style={{ color: 'var(--gogo-text-secondary)' }}>API Key</p>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-[var(--radius-input)] px-3 py-2 font-mono text-xs" style={{ backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-primary)', border: '1px solid var(--gogo-divider)' }}>sk-••••••••••••••••••••••••••••4f2a</code>
                      <button
                        className="shrink-0 rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold transition"
                        style={{ border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-surface)', color: 'var(--gogo-text-secondary)' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-surface)')}
                      >Regenerate</button>
                    </div>
                  </div>
                )}
              </SettingSection>
            </>)}

            {/* Keyboard Shortcuts */}
            {activeSection === 'keyboard' && (
              <SettingSection title="Keyboard Shortcuts" description="Quick reference for available shortcuts." icon={SIDEBAR_ITEMS[8].icon}>
                <div>
                  {SHORTCUTS.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-3" style={i > 0 ? { borderTop: '1px solid var(--gogo-divider)' } : undefined}>
                      <p className="text-sm" style={{ color: 'var(--gogo-text-primary)' }}>{s.action}</p>
                      <div className="flex items-center gap-1">
                        {s.keys.map((key, j) => (
                          <span key={j}>
                            <kbd
                              className="inline-flex min-w-[1.75rem] items-center justify-center rounded-[var(--radius-chip)] px-2 py-1 font-mono text-xs font-medium shadow-sm"
                              style={{ border: '1px solid var(--gogo-divider)', backgroundColor: 'var(--gogo-grey-100)', color: 'var(--gogo-text-primary)' }}
                            >{key}</kbd>
                            {j < s.keys.length - 1 && <span className="mx-0.5 text-xs" style={{ color: 'var(--gogo-text-secondary)' }}>+</span>}
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
              <SettingSection title="Danger Zone" description="These actions are irreversible. Proceed with caution." icon={SIDEBAR_ITEMS[9].icon} variant="danger">
                <div className="space-y-3">
                  {[
                    { title: 'Clear all notifications', desc: 'Remove all notification history permanently.', level: 'amber' as const, btn: 'Clear' },
                    { title: 'Reset all settings', desc: 'Restore all settings to their default values.', level: 'amber' as const, btn: 'Reset' },
                    { title: 'Delete all data', desc: 'Permanently erase all your personal data.', level: 'red' as const, btn: 'Delete Data' },
                    { title: 'Deactivate account', desc: 'Temporarily disable your account.', level: 'red' as const, btn: 'Deactivate' },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex flex-col gap-3 rounded-[var(--radius-button)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        border: item.level === 'amber' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(220,38,38,0.2)',
                        backgroundColor: item.level === 'amber' ? 'rgba(245,158,11,0.05)' : 'rgba(220,38,38,0.03)',
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: item.level === 'amber' ? '#d97706' : '#dc2626' }}>{item.title}</p>
                        <p className="text-xs" style={{ color: item.level === 'amber' ? '#b45309' : '#ef4444' }}>{item.desc}</p>
                      </div>
                      <button
                        className="shrink-0 self-start rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold transition sm:self-auto"
                        style={{
                          border: item.level === 'amber' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(220,38,38,0.3)',
                          color: item.level === 'amber' ? '#d97706' : '#dc2626',
                          backgroundColor: 'var(--gogo-surface)',
                        }}
                      >{item.btn}</button>
                    </div>
                  ))}
                  <div
                    className="flex flex-col gap-3 rounded-[var(--radius-button)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ border: '2px solid rgba(220,38,38,0.4)', backgroundColor: 'rgba(220,38,38,0.05)' }}
                  >
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#dc2626' }}>Delete account permanently</p>
                      <p className="text-xs" style={{ color: '#ef4444' }}>This action cannot be undone. All data will be lost forever.</p>
                    </div>
                    <button
                      className="shrink-0 self-start rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 sm:self-auto"
                      style={{ backgroundColor: '#dc2626' }}
                    >Delete Account</button>
                  </div>
                </div>
              </SettingSection>
            )}

          </div>
        </div>
      </div>

      {/* Unsaved changes bar */}
      {dirty && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 px-6 py-3 backdrop-blur-md"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--gogo-surface) 95%, transparent)',
            borderTop: '1px solid var(--gogo-divider)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: 'var(--gogo-primary)' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--gogo-primary)' }} />
              </span>
              <p className="text-sm font-medium" style={{ color: 'var(--gogo-text-primary)' }}>Unsaved changes</p>
              <p className="hidden text-sm sm:block" style={{ color: 'var(--gogo-text-secondary)' }}>your preferences have not been saved yet</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => { setDirty(false); window.location.reload(); }}
                className="rounded-[var(--radius-button)] px-4 py-2 text-sm font-medium transition"
                style={{ border: '1px solid var(--gogo-divider)', color: 'var(--gogo-text-secondary)', backgroundColor: 'var(--gogo-surface)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-grey-100)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--gogo-surface)')}
              >Discard</button>
              <Button onClick={handleSave} disabled={saving} loading={saving}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
