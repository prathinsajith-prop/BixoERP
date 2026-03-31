import type { AuditFields, Money } from "./common";

// ─── Inventory ───────────────────────────────

export interface InventoryItem extends AuditFields {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  unitOfMeasure: string;
  costPrice: Money;
  sellingPrice: Money;
  reorderPoint: number;
  reorderQuantity: number;
  isActive: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
}

export interface StockLevel {
  itemId: string;
  itemName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  isBelowReorder: boolean;
}

export interface StockMovement extends AuditFields {
  id: string;
  type: "receipt" | "issue" | "transfer" | "adjustment";
  itemId: string;
  itemName: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  quantity: number;
  reference: string;
  reason: string;
}
