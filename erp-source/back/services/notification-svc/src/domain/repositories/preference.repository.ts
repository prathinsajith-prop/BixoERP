import { NotificationPreference } from '../entities/notification-preference.entity';

export interface PreferenceRepository {
  save(preference: NotificationPreference): Promise<void>;
  findByUserId(tenantId: string, userId: string): Promise<NotificationPreference | null>;
}

export const PREFERENCE_REPOSITORY = Symbol('PreferenceRepository');
