import { request } from "./apiClient.js";

export function normalizeLowStockAlert(alert = {}) {
  return {
    materialNo: alert.materialNo ?? "",
    productName: alert.productName ?? "",
    warehouseId: alert.warehouseId ?? "",
    warehouseName: alert.warehouseName ?? "",
    quantity: Number(alert.quantity ?? 0),
    minLevel: Number(alert.minLevel ?? 0),
    deficit: Number(alert.deficit ?? 0),
  };
}

export async function fetchLowStockAlerts() {
  const data = await request("/api/alerts/low-stock");
  return Array.isArray(data) ? data.map(normalizeLowStockAlert) : [];
}

export async function fetchLowStockCount() {
  const data = await request("/api/alerts/count");
  return Number(data?.count ?? 0);
}

export async function updateStockThreshold(matnr, whId, minLevel) {
  await request(`/api/stocks/${encodeURIComponent(matnr)}/${encodeURIComponent(whId)}/threshold`, {
    method: "PUT",
    body: { minLevel: Number(minLevel) },
  });
}
