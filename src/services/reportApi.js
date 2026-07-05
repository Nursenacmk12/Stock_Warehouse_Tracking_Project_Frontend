import { request, getApiBaseUrl } from "./apiClient.js";

export async function fetchStockSummaryReport() {
  return request("/api/reports/stock-summary");
}

export async function fetchMovementTrend(granularity = "daily") {
  return request("/api/reports/movement-trend", { query: { granularity } });
}

export async function fetchWarehouseComparison() {
  return request("/api/reports/warehouse-comparison");
}

export async function downloadReportExport(format = "csv") {
  const base = getApiBaseUrl();
  const token = localStorage.getItem("stock_auth_token");
  const url = `${base}/api/reports/export?format=${encodeURIComponent(format)}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Rapor dışa aktarılamadı.");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = format === "xlsx" ? "hareket-raporu.csv" : "hareket-raporu.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
