import { MOCK_WAREHOUSES } from "../data/mockSapData.js";
import { request } from "./apiClient.js";
import { withSapMockFallback } from "./sapFallback.js";

export function normalizeWarehouse(warehouse = {}) {
  return {
    id: Number(warehouse.warehouseId ?? warehouse.id ?? 0),
    warehouseId: Number(warehouse.warehouseId ?? warehouse.id ?? 0),
    code: warehouse.code ?? "",
    name: warehouse.name ?? "",
    location: warehouse.location ?? "",
    createdAt: warehouse.createdAt ?? null,
  };
}

function createPayload(payload) {
  return {
    code: payload.code?.trim(),
    name: payload.name?.trim(),
    location: payload.location?.trim() || null,
  };
}

function updatePayload(payload) {
  return {
    name: payload.name?.trim(),
    location: payload.location?.trim() || null,
  };
}

export async function fetchWarehouses() {
  return withSapMockFallback(
    async () => {
      const data = await request("/api/warehouses");
      return Array.isArray(data) ? data.map(normalizeWarehouse) : [];
    },
    () => MOCK_WAREHOUSES.map(normalizeWarehouse),
    { label: "warehouses", isEmpty: (rows) => !Array.isArray(rows) || rows.length === 0 },
  );
}

export async function createWarehouse(payload) {
  return normalizeWarehouse(await request("/api/warehouses", { method: "POST", body: createPayload(payload) }));
}

export async function updateWarehouse(id, payload) {
  return normalizeWarehouse(await request(`/api/warehouses/${id}`, { method: "PUT", body: updatePayload(payload) }));
}

export async function deleteWarehouse(id) {
  await request(`/api/warehouses/${id}`, { method: "DELETE" });
  return true;
}
