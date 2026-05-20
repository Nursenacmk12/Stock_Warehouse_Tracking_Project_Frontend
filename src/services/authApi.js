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

  const token = result.data?.token ?? "";
  const userName = result.data?.userName ?? "";
  const role = result.data?.role ?? "";
  const expiresAt = result.data?.expiresAt ?? "";

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
