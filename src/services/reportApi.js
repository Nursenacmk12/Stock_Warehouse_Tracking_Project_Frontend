import {
  MOCK_MOVEMENT_TREND,
  MOCK_STOCK_SUMMARY_REPORT,
  MOCK_WAREHOUSE_COMPARISON,
} from "../data/mockSapData.js";
import { request, getApiBaseUrl } from "./apiClient.js";
import { withSapMockFallback } from "./sapFallback.js";

export async function fetchStockSummaryReport() {
  return withSapMockFallback(
    () => request("/api/reports/stock-summary"),
    () => ({ ...MOCK_STOCK_SUMMARY_REPORT }),
    {
      label: "stock-summary",
      isEmpty: (data) => !data || (Number(data.totalQuantity ?? 0) === 0 && Number(data.productCount ?? 0) === 0),
    },
  );
}

export async function fetchMovementTrend(granularity = "daily", dateFrom, dateTo) {
  return withSapMockFallback(
    () =>
      request("/api/reports/movement-trend", {
        query: { granularity, dateFrom, dateTo },
      }),
    () => MOCK_MOVEMENT_TREND.map((row) => ({ ...row })),
    { label: "movement-trend", isEmpty: (rows) => !Array.isArray(rows) || rows.length === 0 },
  );
}

export async function fetchWarehouseComparison() {
  return withSapMockFallback(
    () => request("/api/reports/warehouse-comparison"),
    () => MOCK_WAREHOUSE_COMPARISON.map((row) => ({ ...row })),
    { label: "warehouse-comparison", isEmpty: (rows) => !Array.isArray(rows) || rows.length === 0 },
  );
}

export async function emailReport(payload) {
  return request("/api/reports/email", {
    method: "POST",
    body: {
      to: payload.to || null,
      periodDays: Number(payload.periodDays ?? 7),
      includeCsv: Boolean(payload.includeCsv ?? true),
      provider: payload.provider || null,
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
