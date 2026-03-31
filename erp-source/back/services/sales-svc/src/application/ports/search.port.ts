/** Port for full-text search — implemented by Elasticsearch in infrastructure */
export interface SearchPort {
  indexOrder(order: OrderSearchDocument): Promise<void>;
  searchOrders(query: string, tenantId: string): Promise<OrderSearchResult[]>;
  removeOrder(orderId: string, tenantId: string): Promise<void>;
}

export interface OrderSearchDocument {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  totalAmount: string;
  currency: string;
  lines: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  tenantId: string;
  confirmedAt: string | null;
  createdAt: string;
}

export interface OrderSearchResult {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: string;
  currency: string;
  score: number;
}

export const SEARCH_PORT = Symbol('SearchPort');
