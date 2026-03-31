import type { AuditFields } from "./common";

// ─── Manufacturing ───────────────────────────

export interface BillOfMaterials extends AuditFields {
  id: string;
  productId: string;
  productName: string;
  version: string;
  status: "draft" | "active" | "obsolete";
  components: BOMComponent[];
}

export interface BOMComponent {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitOfMeasure: string;
  scrapPercentage: number;
}

export interface WorkOrder extends AuditFields {
  id: string;
  workOrderNumber: string;
  productId: string;
  productName: string;
  bomId: string;
  quantity: number;
  completedQuantity: number;
  status: "planned" | "released" | "in-progress" | "completed" | "cancelled";
  startDate: string;
  dueDate: string;
  completionDate: string | null;
}
