/** OpenAPI-derived API contract types (manual baseline; generate with openapi-typescript). */
export interface DashboardSummary {
  sapStatus: string;
  productCount: number;
  warehouseCount: number;
  totalStockQuantity: number;
  emptyStockLines: number;
  sapOnlyProductCount: number;
  lowStockCount: number;
}

export interface HealthStatus {
  api: string;
  database: string;
  sap: string;
}

export interface LowStockAlert {
  materialNo: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minLevel: number;
  deficit: number;
}
