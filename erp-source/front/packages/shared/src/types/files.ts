import type { AuditFields } from "./common";

// ─── Files ───────────────────────────────────

export interface FileRecord extends AuditFields {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
}
