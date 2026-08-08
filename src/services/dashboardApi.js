import { MOCK_DASHBOARD_SUMMARY } from "../data/mockSapData.js";
import { request } from "./apiClient.js";
import { normalizeMovement } from "./movementApi.js";
import { withSapMockFallback } from "./sapFallback.js";

function normalizeDistribution(item = {}) {
  return {
    code: item.code ?? "",
    name: item.name ?? "",
    quantity: Number(item.quantity ?? 0),
  };
}

export function normalizeDashboardSummary(data = {}) {
  return {
    sapStatus: data.sapStatus ?? "unknown",
    productCount: Number(data.productCount ?? 0),
    warehouseCount: Number(data.warehouseCount ?? 0),
    totalStockQuantity: Number(data.totalStockQuantity ?? 0),
    emptyStockLines: Number(data.emptyStockLines ?? 0),
    sapOnlyProductCount: Number(data.sapOnlyProductCount ?? 0),
    lowStockCount: Number(data.lowStockCount ?? 0),
    recentMovements: Array.isArray(data.recentMovements)
      ? data.recentMovements.map(normalizeMovement)
      : [],
    warehouseStockDistribution: Array.isArray(data.warehouseStockDistribution)
      ? data.warehouseStockDistribution.map(normalizeDistribution)
      : [],
    categoryStockDistribution: Array.isArray(data.categoryStockDistribution)
      ? data.categoryStockDistribution.map(normalizeDistribution)
      : [],
  };
}

export async function fetchDashboardSummary() {
  return withSapMockFallback(
    async () => {
      const data = await request("/api/dashboard/summary");
      return normalizeDashboardSummary(data);
    },
    () => normalizeDashboardSummary(MOCK_DASHBOARD_SUMMARY),
    {
      label: "dashboard",
      isEmpty: (summary) =>
        !summary ||
        (Number(summary.productCount) === 0 &&
          Number(summary.totalStockQuantity) === 0 &&
          (summary.warehouseStockDistribution?.length ?? 0) === 0),
    },
  );
}

export async function fetchHealthStatus() {
  return request("/api/health/status");
}
