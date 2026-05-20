import { apiFetch } from "./apiClient.js";

export async function fetchHealth(path = "/health") {
  try {
    const { res, json, text } = await apiFetch(path);
    return {
      ok: res.ok,
      status: res.status,
      data: json ?? text,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
    };
  }
}
