import { request } from "./apiClient.js";

export async function fetchIntegrations() {
  const data = await request("/api/integrations");
  return Array.isArray(data) ? data : [];
}

export async function syncIntegration(name) {
  return request(`/api/integrations/${encodeURIComponent(name)}/sync`, { method: "POST" });
}

export async function fetchNotificationPreferences() {
  return request("/api/notifications/preferences");
}

export async function updateNotificationPreferences(payload) {
  return request("/api/notifications/preferences", { method: "PUT", body: payload });
}
