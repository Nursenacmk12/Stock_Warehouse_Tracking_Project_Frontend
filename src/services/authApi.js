import { request, toApiResult } from "./apiClient.js";

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: true, token: string, userName: string, role: string, expiresAt: string } | { ok: false, message: string }>}
 */
export async function loginWithApi(email, password) {
  const result = await toApiResult(
    request("/api/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
    }),
  );
  if (!result.ok) return { ok: false, message: result.message };

  return normalizeLoginPayload(result.data);
}

/**
 * Public Entra SSO status from the API (no secrets).
 * @returns {Promise<{ ok: true, data: { enabled: boolean, tenantId?: string, clientId?: string, redirectUri?: string, authority?: string, message?: string } } | { ok: false, message: string }>}
 */
export async function fetchEntraConfig() {
  return toApiResult(request("/api/auth/entra/config"));
}

/**
 * Exchange Entra id_token for StockGuard JWT (same shape as password login).
 * @param {string} idToken
 */
export async function loginWithEntraToken(idToken) {
  const result = await toApiResult(
    request("/api/auth/entra/login", {
      method: "POST",
      body: { idToken },
    }),
  );
  if (!result.ok) return { ok: false, message: result.message };

  return normalizeLoginPayload(result.data);
}

function normalizeLoginPayload(data) {
  const token = data?.token ?? "";
  const userName = data?.userName ?? "";
  const role = data?.role ?? "";
  const expiresAt = data?.expiresAt ?? "";

  if (!token) {
    return { ok: false, message: "Sunucu geçerli bir oturum anahtarı döndürmedi." };
  }

  return { ok: true, token, userName, role, expiresAt };
}

/**
 * @param {{ name: string, email: string, password: string, roleId?: number }} payload
 */
export async function registerWithApi(payload) {
  const body = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    roleId: payload.roleId ?? 2,
  };

  const result = await toApiResult(request("/api/auth/register", { method: "POST", body }));
  if (!result.ok) return { ok: false, message: result.message };

  return { ok: true, message: result.data?.message ?? "Kayıt tamamlandı." };
}
