export interface UserSettings {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: number;
    compactMode: boolean;
    animations: boolean;
    reducedMotion: boolean;
    sidebarPosition: 'left' | 'right';
  };
  notifications: {
    channels: { email: boolean; push: boolean; desktop: boolean; sound: boolean; soundPicker: string };
    activityTypes: { mentions: boolean; tasks: boolean; moduleUpdates: boolean; digest: boolean };
    quietHours: { enabled: boolean; start: string; end: string };
  };
  security: {
    twoFactorEnabled: boolean;
    biometricLogin: boolean;
    loginAlerts: boolean;
    ipWhitelisting: boolean;
    sessionTimeoutMinutes: number;
    passwordExpiryDays: number;
  };
  privacy: {
    profileVisibility: 'everyone' | 'team' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    searchVisibility: boolean;
    activityStatus: boolean;
    readReceipts: boolean;
    analyticsOptIn: boolean;
    thirdPartyDataSharing: boolean;
  };
  languageRegion: {
    language: string;
    timezone: string;
    firstDayOfWeek: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    numberFormat: string;
    currency: string;
  };
  accessibility: {
    highContrast: boolean;
    textSpacing: boolean;
    focusIndicators: boolean;
    keyboardNavigation: boolean;
    screenReaderOptimization: boolean;
    autoplayMedia: boolean;
    closedCaptions: boolean;
    tooltipDelayMs: number;
  };
  dataStorage: {
    autoSave: boolean;
    autoSaveIntervalSeconds: number;
    cacheEnabled: boolean;
    offlineMode: boolean;
  };
  integrations: {
    connectedApps: Record<string, boolean>;
    apiAccessEnabled: boolean;
    webhooksEnabled: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  appearance: {
    theme: 'system',
    accentColor: 'blue',
    fontSize: 14,
    compactMode: false,
    animations: true,
    reducedMotion: false,
    sidebarPosition: 'left',
  },
  notifications: {
    channels: { email: true, push: true, desktop: true, sound: true, soundPicker: 'default' },
    activityTypes: { mentions: true, tasks: true, moduleUpdates: true, digest: true },
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
  },
  security: {
    twoFactorEnabled: false,
    biometricLogin: false,
    loginAlerts: true,
    ipWhitelisting: false,
    sessionTimeoutMinutes: 30,
    passwordExpiryDays: 90,
  },
  privacy: {
    profileVisibility: 'team',
    showEmail: true,
    showPhone: false,
    searchVisibility: true,
    activityStatus: true,
    readReceipts: true,
    analyticsOptIn: true,
    thirdPartyDataSharing: false,
  },
  languageRegion: {
    language: 'en',
    timezone: 'UTC',
    firstDayOfWeek: 'monday',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberFormat: '1,000.00',
    currency: 'USD',
  },
  accessibility: {
    highContrast: false,
    textSpacing: false,
    focusIndicators: true,
    keyboardNavigation: true,
    screenReaderOptimization: false,
    autoplayMedia: true,
    closedCaptions: false,
    tooltipDelayMs: 500,
  },
  dataStorage: {
    autoSave: true,
    autoSaveIntervalSeconds: 30,
    cacheEnabled: true,
    offlineMode: false,
  },
  integrations: {
    connectedApps: { slack: false, google: false, microsoft365: false, jira: false, github: false, zapier: false },
    apiAccessEnabled: false,
    webhooksEnabled: false,
  },
};
