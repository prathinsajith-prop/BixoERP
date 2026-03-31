// ─── Audit ───────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  service: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
}
