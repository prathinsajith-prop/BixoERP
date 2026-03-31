import type { AuditFields } from "./common";

// ─── Integrations ────────────────────────────

export interface WebhookSubscription extends AuditFields {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastTriggeredAt: string | null;
  failureCount: number;
}
