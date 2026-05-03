import { apiFetch, formatApiErrorPayload } from "./apiClient.js";

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ ok: true, token: string, userName: string, role: string, expiresAt: string } | { ok: false, message: string }>}
 */
export async function loginWithApi(email, password) {
  let res;
  let json;
  try {
    const out = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    res = out.res;
    json = out.json;
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı. API’nin çalıştığından emin olun." };
  }

  if (!res.ok) {
    return { ok: false, message: formatApiErrorPayload(json) };
  }

  const token = json?.token ?? "";
  const userName = json?.userName ?? "";
  const role = json?.role ?? "";
  const expiresAt = json?.expiresAt ?? "";

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

  let res;
  let json;
  try {
    const out = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    res = out.res;
    json = out.json;
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı. API’nin çalıştığından emin olun." };
  }

  if (!res.ok) {
    return { ok: false, message: formatApiErrorPayload(json) };
  }

  return { ok: true, message: json?.message ?? "Kayıt tamamlandı." };
}
