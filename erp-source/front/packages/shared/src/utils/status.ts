const STATUS_COLORS: Record<string, string> = {
  // Positive
  active: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  paid: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  posted: "bg-green-100 text-green-800",
  delivered: "bg-green-100 text-green-800",
  done: "bg-green-100 text-green-800",
  received: "bg-green-100 text-green-800",
  processed: "bg-green-100 text-green-800",
  // Warning / In-progress
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  partial: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-blue-100 text-blue-800",
  "on-hold": "bg-yellow-100 text-yellow-800",
  "soft-closed": "bg-yellow-100 text-yellow-800",
  review: "bg-purple-100 text-purple-800",
  probation: "bg-yellow-100 text-yellow-800",
  planning: "bg-blue-100 text-blue-800",
  submitted: "bg-blue-100 text-blue-800",
  sent: "bg-blue-100 text-blue-800",
  confirmed: "bg-blue-100 text-blue-800",
  released: "bg-blue-100 text-blue-800",
  calculated: "bg-blue-100 text-blue-800",
  // Negative
  cancelled: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
  overdue: "bg-red-100 text-red-800",
  terminated: "bg-red-100 text-red-800",
  void: "bg-red-100 text-red-800",
  reversed: "bg-red-100 text-red-800",
  "hard-closed": "bg-red-100 text-red-800",
  obsolete: "bg-red-100 text-red-800",
  // Neutral
  open: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
  escalated: "bg-orange-100 text-orange-800",
  "on-leave": "bg-purple-100 text-purple-800",
};

export function statusColor(status: string): string {
  return STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
}
