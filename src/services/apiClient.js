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

function buildUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function formatApiErrorPayload(data) {
  if (!data || typeof data !== "object") return "Beklenmeyen bir hata oluştu.";
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(" ");
  }
  if (typeof data.title === "string" && data.title.trim()) return data.title;
  if (typeof data.message === "string" && data.message.trim()) return data.message;
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

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("stock_auth_token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(buildUrl(path), { ...init, headers });
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
