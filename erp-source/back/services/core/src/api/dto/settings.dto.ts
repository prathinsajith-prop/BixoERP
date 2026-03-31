import { z } from 'zod';

export const UpdateSettingsDto = z.object({
  appearance: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    accentColor: z.enum(['blue', 'purple', 'green', 'red', 'orange', 'pink', 'teal', 'indigo', 'amber', 'cyan']).optional(),
    fontSize: z.number().min(12).max(24).optional(),
    compactMode: z.boolean().optional(),
    animations: z.boolean().optional(),
    reducedMotion: z.boolean().optional(),
    sidebarPosition: z.enum(['left', 'right']).optional(),
  }).optional(),
  notifications: z.object({
    channels: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      desktop: z.boolean().optional(),
      sound: z.boolean().optional(),
      soundPicker: z.string().max(50).optional(),
    }).optional(),
    activityTypes: z.object({
      mentions: z.boolean().optional(),
      tasks: z.boolean().optional(),
      moduleUpdates: z.boolean().optional(),
      digest: z.boolean().optional(),
    }).optional(),
    quietHours: z.object({
      enabled: z.boolean().optional(),
      start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    }).optional(),
  }).optional(),
  security: z.object({
    twoFactorEnabled: z.boolean().optional(),
    biometricLogin: z.boolean().optional(),
    loginAlerts: z.boolean().optional(),
    ipWhitelisting: z.boolean().optional(),
    sessionTimeoutMinutes: z.number().min(5).max(1440).optional(),
    passwordExpiryDays: z.number().min(0).max(365).optional(),
  }).optional(),
  privacy: z.object({
    profileVisibility: z.enum(['everyone', 'team', 'private']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    searchVisibility: z.boolean().optional(),
    activityStatus: z.boolean().optional(),
    readReceipts: z.boolean().optional(),
    analyticsOptIn: z.boolean().optional(),
    thirdPartyDataSharing: z.boolean().optional(),
  }).optional(),
  languageRegion: z.object({
    language: z.string().max(10).optional(),
    timezone: z.string().max(50).optional(),
    firstDayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
    dateFormat: z.string().max(20).optional(),
    timeFormat: z.enum(['12h', '24h']).optional(),
    numberFormat: z.string().max(20).optional(),
    currency: z.string().max(5).optional(),
  }).optional(),
  accessibility: z.object({
    highContrast: z.boolean().optional(),
    textSpacing: z.boolean().optional(),
    focusIndicators: z.boolean().optional(),
    keyboardNavigation: z.boolean().optional(),
    screenReaderOptimization: z.boolean().optional(),
    autoplayMedia: z.boolean().optional(),
    closedCaptions: z.boolean().optional(),
    tooltipDelayMs: z.number().min(0).max(5000).optional(),
  }).optional(),
  dataStorage: z.object({
    autoSave: z.boolean().optional(),
    autoSaveIntervalSeconds: z.number().min(10).max(600).optional(),
    cacheEnabled: z.boolean().optional(),
    offlineMode: z.boolean().optional(),
  }).optional(),
  integrations: z.object({
    connectedApps: z.record(z.boolean()).optional(),
    apiAccessEnabled: z.boolean().optional(),
    webhooksEnabled: z.boolean().optional(),
  }).optional(),
});
export type UpdateSettingsDto = z.infer<typeof UpdateSettingsDto>;
