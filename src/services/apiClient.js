export const TOKEN_KEY = "stock_auth_token";
export const USER_KEY = "stock_auth_user";

let unauthorizedHandler = null;

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

function trimTrailingSlashes(s) {
  return s.replace(/\/+$/, "");
}

/**
 * Boş bırakılırsa istekler aynı origin üzerinden gider (Vite `server.proxy` ile `/api` → API).
 * Production için örn. `VITE_API_BASE_URL=https://localhost:7021`
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || String(raw).trim() === "") return "";
  return trimTrailingSlashes(String(raw).trim());
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, value instanceof Date ? value.toISOString() : String(value));
  });

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function buildUrl(path, query) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}${query ? buildQuery(query) : ""}`;
}

export function formatApiErrorPayload(data) {
  if (!data || typeof data !== "object") return "Beklenmeyen bir hata oluştu.";
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }
  if (data.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors).flat().filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  if (typeof data.title === "string" && data.title.trim()) return data.title;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return "İstek tamamlanamadı.";
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const { query, ...fetchInit } = init;
  const res = await fetch(buildUrl(path, query), { ...fetchInit, headers });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { res, json, text };
}

export async function request(path, init = {}) {
  let body = init.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    body = JSON.stringify(body);
  }

  let out;
  try {
    out = await apiFetch(path, { ...init, body });
  } catch {
    throw new ApiError("Sunucuya ulaşılamadı. API’nin çalıştığından emin olun.");
  }

  const { res, json, text } = out;
  if (!res.ok) {
    if (res.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const message = json ? formatApiErrorPayload(json) : text || "İstek tamamlanamadı.";
    throw new ApiError(message, { status: res.status, data: json });
  }

  if (res.status === 204) return null;
  return json ?? text ?? null;
}

export async function toApiResult(promise) {
  try {
    const data = await promise;
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "İstek tamamlanamadı.",
      status: error instanceof ApiError ? error.status : 0,
    };
  }
}
