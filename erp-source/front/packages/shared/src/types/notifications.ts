// ─── Notifications ───────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}
