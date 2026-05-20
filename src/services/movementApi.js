import { request } from "./apiClient.js";

export const movementTypeOptions = [
  { value: "1", label: "Stok Giriş" },
  { value: "2", label: "Stok Çıkış" },
  { value: "3", label: "Transfer" },
];

const movementTypeMap = {
  1: { code: "in", label: "Stok Giriş" },
  2: { code: "out", label: "Stok Çıkış" },
  3: { code: "transfer", label: "Transfer" },
  In: { code: "in", label: "Stok Giriş" },
  Out: { code: "out", label: "Stok Çıkış" },
  Transfer: { code: "transfer", label: "Transfer" },
};

export function normalizePagedResult(data = {}) {
  const pageSize = Number(data.pageSize ?? 20);
  const totalCount = Number(data.totalCount ?? 0);

  return {
    items: Array.isArray(data.items) ? data.items : [],
    totalCount,
    page: Number(data.page ?? 1),
    pageSize,
    totalPages: Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)))),
  };
}

export function normalizeMovement(movement = {}) {
  const typeInfo = movementTypeMap[movement.typeName] ?? movementTypeMap[movement.type] ?? {
    code: "neutral",
    label: movement.typeName ?? "Bilinmeyen",
  };

  return {
    id: Number(movement.movementId ?? movement.id ?? 0),
    movementId: Number(movement.movementId ?? movement.id ?? 0),
    type: movement.type,
    typeCode: typeInfo.code,
    typeLabel: typeInfo.label,
    quantity: Number(movement.quantity ?? 0),
    date: movement.date ?? null,
    refNo: movement.refNo ?? "",
    productCode: movement.productCode ?? "",
    sourceWarehouseCode: movement.sourceWarehouseCode ?? "",
    destWarehouseCode: movement.destWarehouseCode ?? "",
    userName: movement.userName ?? "",
  };
}

export async function fetchMovements(filters = {}) {
  const data = await request("/api/movements", {
    query: {
      productId: filters.productId,
      warehouseId: filters.warehouseId,
      type: filters.type,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      userId: filters.userId,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
  const paged = normalizePagedResult(data);
  return { ...paged, items: paged.items.map(normalizeMovement) };
}
