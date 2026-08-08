/**
 * Hand-written UI helpers for common API payloads.
 * Full contract: `generated-api.d.ts` (npm run generate:api-types).
 */
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

/** JWT role claim values — keep in sync with API RoleType / FE guards. */
export type AppRole = "SuperAdmin" | "Admin" | "WarehouseManager" | "Manager";
