import { MOCK_STOCKS } from "../data/mockSapData.js";
import { request } from "./apiClient.js";
import { withSapMockFallback } from "./sapFallback.js";

export function normalizeStock(stock = {}) {
  return {
    id: `${stock.materialNo ?? ""}-${stock.warehouseId ?? ""}`,
    materialNo: stock.materialNo ?? "",
    warehouseId: stock.warehouseId ?? "",
    quantity: Number(stock.quantity ?? 0),
    updatedAt: stock.updatedAt ?? null,
  };
}

function filterMockStocks(filters = {}) {
  return MOCK_STOCKS.filter((row) => {
    if (filters.materialNo && row.materialNo !== filters.materialNo) return false;
    if (filters.warehouseId && row.warehouseId !== filters.warehouseId) return false;
    return true;
  }).map(normalizeStock);
}

export async function fetchStocks(filters = {}) {
  const hasFilters = Boolean(filters.materialNo || filters.warehouseId);
  return withSapMockFallback(
    async () => {
      const data = await request("/api/stocks", {
        query: {
          matnr: filters.materialNo,
          whId: filters.warehouseId,
        },
      });
      return Array.isArray(data) ? data.map(normalizeStock) : [];
    },
    () => filterMockStocks(filters),
    {
      label: "stocks",
      isEmpty: (rows) => !hasFilters && (!Array.isArray(rows) || rows.length === 0),
    },
  );
}

export async function stockIn(payload) {
  return normalizeStock(
    await request("/api/stocks/in", {
      method: "POST",
      body: {
        materialNo: payload.materialNo,
        warehouseId: payload.warehouseId,
        quantity: Number(payload.quantity),
        refNo: payload.refNo?.trim() || null,
      },
    }),
  );
}

export async function stockOut(payload) {
  return normalizeStock(
    await request("/api/stocks/out", {
      method: "POST",
      body: {
        materialNo: payload.materialNo,
        warehouseId: payload.warehouseId,
        quantity: Number(payload.quantity),
        refNo: payload.refNo?.trim() || null,
      },
    }),
  );
}

export async function fetchStockDetail(matnr, whId) {
  return withSapMockFallback(
    async () => normalizeStock(await request(`/api/stocks/${encodeURIComponent(matnr)}/${encodeURIComponent(whId)}`)),
    () => {
      const row = MOCK_STOCKS.find((item) => item.materialNo === matnr && item.warehouseId === whId);
      return normalizeStock(row ?? { materialNo: matnr, warehouseId: whId, quantity: 0, updatedAt: null });
    },
    {
      label: "stock-detail",
      // Detail miss should stay empty/error-driven; only timeout/network use mock.
      isEmpty: () => false,
    },
  );
}

export async function transferStock(payload) {
  return normalizeStock(
    await request("/api/stocks/transfer", {
      method: "POST",
      body: {
        materialNo: payload.materialNo,
        sourceWarehouseId: payload.sourceWarehouseId,
        destWarehouseId: payload.destWarehouseId,
        quantity: Number(payload.quantity),
        refNo: payload.refNo?.trim() || null,
      },
    }),
  );
}
