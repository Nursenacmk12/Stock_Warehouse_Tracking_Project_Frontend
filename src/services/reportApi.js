import { request, getApiBaseUrl } from "./apiClient.js";

export async function fetchStockSummaryReport() {
  return request("/api/reports/stock-summary");
}

export async function fetchMovementTrend(granularity = "daily", dateFrom, dateTo) {
  return request("/api/reports/movement-trend", {
    query: { granularity, dateFrom, dateTo },
  });
}

export async function fetchWarehouseComparison() {
  return request("/api/reports/warehouse-comparison");
}

export async function emailReport(payload) {
  return request("/api/reports/email", {
    method: "POST",
    body: {
      to: payload.to || null,
      periodDays: Number(payload.periodDays ?? 7),
      includeCsv: Boolean(payload.includeCsv ?? true),
    },
  });
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
  link.download = "hareket-raporu.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
