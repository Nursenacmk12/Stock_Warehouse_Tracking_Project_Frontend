import { request } from "./apiClient.js";

export function normalizeStock(stock = {}) {
  return {
    id: `${stock.materialNo ?? ""}-${stock.warehouseId ?? ""}`,
    materialNo: stock.materialNo ?? "",
    warehouseId: stock.warehouseId ?? "",
    quantity: Number(stock.quantity ?? 0),
    updatedAt: stock.updatedAt ?? null,
  };
}

export async function fetchStocks(filters = {}) {
  const data = await request("/api/stocks", {
    query: {
      matnr: filters.materialNo,
      whId: filters.warehouseId,
    },
  });
  return Array.isArray(data) ? data.map(normalizeStock) : [];
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
