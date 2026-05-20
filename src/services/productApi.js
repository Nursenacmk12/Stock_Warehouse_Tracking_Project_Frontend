import { request } from "./apiClient.js";

export function normalizeProduct(product = {}) {
  return {
    id: Number(product.productId ?? product.id ?? 0),
    productId: Number(product.productId ?? product.id ?? 0),
    code: product.code ?? "",
    name: product.name ?? "",
    unit: product.unit ?? "ADET",
    category: product.category ?? "Genel",
    barcode: product.barcode ?? "",
    createdAt: product.createdAt ?? null,
    isSapOnly: Number(product.productId ?? 0) === 0,
  };
}

function productPayload(payload) {
  return {
    code: payload.code?.trim(),
    name: payload.name?.trim(),
    unit: payload.unit?.trim() || "ADET",
    category: payload.category?.trim() || null,
    barcode: payload.barcode?.trim() || null,
  };
}

function productUpdatePayload(payload) {
  return {
    name: payload.name?.trim(),
    unit: payload.unit?.trim() || "ADET",
    category: payload.category?.trim() || null,
    barcode: payload.barcode?.trim() || null,
  };
}

export async function fetchProducts() {
  const data = await request("/api/products");
  return Array.isArray(data) ? data.map(normalizeProduct) : [];
}

export async function createProduct(payload) {
  return normalizeProduct(await request("/api/products", { method: "POST", body: productPayload(payload) }));
}

export async function updateProduct(id, payload) {
  return normalizeProduct(
    await request(`/api/products/${id}`, { method: "PUT", body: productUpdatePayload(payload) }),
  );
}

export async function deleteProduct(id) {
  await request(`/api/products/${id}`, { method: "DELETE" });
  return true;
}
