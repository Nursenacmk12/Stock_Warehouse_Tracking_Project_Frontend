import { apiFetch, formatApiErrorPayload } from "./apiClient.js";

export async function fetchUsers() {
  try {
    const { res, json } = await apiFetch("/api/users");
    if (!res.ok) return { ok: false, message: formatApiErrorPayload(json) };
    return { ok: true, data: json };
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı." };
  }
}

export async function fetchRoles() {
  try {
    const { res, json } = await apiFetch("/api/users/roles");
    if (!res.ok) return { ok: false, message: formatApiErrorPayload(json) };
    return { ok: true, data: json };
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı." };
  }
}

export async function createUser(payload) {
  try {
    const { res, json } = await apiFetch("/api/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, message: formatApiErrorPayload(json) };
    return { ok: true, data: json };
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı." };
  }
}

export async function updateUser(id, payload) {
  try {
    const { res, json } = await apiFetch(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, message: formatApiErrorPayload(json) };
    return { ok: true, data: json };
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı." };
  }
}

export async function changeUserRole(id, roleId) {
  try {
    const { res, json } = await apiFetch(`/api/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ roleId }),
    });
    if (!res.ok) return { ok: false, message: formatApiErrorPayload(json) };
    return { ok: true };
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı." };
  }
}

export async function deleteUser(id) {
  try {
    const { res, json } = await apiFetch(`/api/users/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return { ok: false, message: formatApiErrorPayload(json) };
    return { ok: true };
  } catch {
    return { ok: false, message: "Sunucuya ulaşılamadı." };
  }
}
