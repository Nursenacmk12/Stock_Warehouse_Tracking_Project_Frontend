import { request } from "./apiClient.js";

export async function fetchIntegrations() {
  const data = await request("/api/integrations");
  return Array.isArray(data) ? data : [];
}

/**
 * POST /api/integrations/{name}/sync
 * Returns IntegrationSyncResultDto: success, message, syncedAt, status, isMock, error, …
 */
export async function syncIntegration(name) {
  return request(`/api/integrations/${encodeURIComponent(name)}/sync`, { method: "POST" });
}

export async function fetchNotificationPreferences() {
  return request("/api/notifications/preferences");
}

export async function updateNotificationPreferences(payload) {
  return request("/api/notifications/preferences", { method: "PUT", body: payload });
}

/**
 * SMTP settings contract (backend):
 * GET  /api/notifications/smtp
 * PUT  /api/notifications/smtp
 * POST /api/notifications/smtp/test
 *
 * Password is write-only: omit or leave blank to keep existing secret.
 * Host credentials should come from server env / secure store — never hardcode.
 */
export function normalizeSmtpSettings(data = {}) {
  return {
    enabled: Boolean(data.enabled),
    host: data.host ?? "",
    port: Number(data.port ?? 587),
    useSsl: data.useSsl !== false,
    userName: data.userName ?? data.username ?? "",
    fromEmail: data.fromEmail ?? "",
    fromName: data.fromName ?? "",
    hasPassword: Boolean(data.hasPassword),
    provider: data.provider ?? "Smtp",
  };
}

export async function fetchSmtpSettings() {
  const data = await request("/api/notifications/smtp");
  return normalizeSmtpSettings(data);
}

export async function updateSmtpSettings(payload) {
  const body = {
    enabled: Boolean(payload.enabled),
    host: payload.host?.trim() || "",
    port: Number(payload.port ?? 587),
    useSsl: payload.useSsl !== false,
    userName: payload.userName?.trim() || "",
    fromEmail: payload.fromEmail?.trim() || "",
    fromName: payload.fromName?.trim() || "",
  };
  if (payload.password != null && String(payload.password).length > 0) {
    body.password = String(payload.password);
  }
  const data = await request("/api/notifications/smtp", { method: "PUT", body });
  return normalizeSmtpSettings(data);
}

export async function testSmtpSettings(payload = {}) {
  const body = {
    to: payload.to?.trim() || null,
  };
  return request("/api/notifications/smtp/test", { method: "POST", body });
}

/**
 * Slack / Teams webhook contract (backend):
 * GET  /api/notifications/slack|teams
 * PUT  /api/notifications/slack|teams
 * POST /api/notifications/slack|teams/test
 *
 * Webhook URL is write-only: omit or leave blank to keep existing secret.
 * GET returns webhookUrlMasked + hasWebhookUrl only — never the full URL.
 */
export function normalizeWebhookChannel(data = {}, provider = "Slack") {
  return {
    enabled: Boolean(data.enabled),
    hasWebhookUrl: Boolean(data.hasWebhookUrl),
    webhookUrlMasked: data.webhookUrlMasked ?? "",
    webhookUrl: "",
    provider: data.provider ?? provider,
  };
}

async function fetchWebhookChannel(path, provider) {
  const data = await request(`/api/notifications/${path}`);
  return normalizeWebhookChannel(data, provider);
}

async function updateWebhookChannel(path, provider, payload) {
  const body = {
    enabled: Boolean(payload.enabled),
  };
  if (payload.webhookUrl != null && String(payload.webhookUrl).trim().length > 0) {
    body.webhookUrl = String(payload.webhookUrl).trim();
  }
  const data = await request(`/api/notifications/${path}`, { method: "PUT", body });
  return normalizeWebhookChannel(data, provider);
}

export async function fetchSlackSettings() {
  return fetchWebhookChannel("slack", "Slack");
}

export async function updateSlackSettings(payload) {
  return updateWebhookChannel("slack", "Slack", payload);
}

export async function testSlackSettings() {
  return request("/api/notifications/slack/test", { method: "POST", body: {} });
}

export async function fetchTeamsSettings() {
  return fetchWebhookChannel("teams", "Teams");
}

export async function updateTeamsSettings(payload) {
  return updateWebhookChannel("teams", "Teams", payload);
}

export async function testTeamsSettings() {
  return request("/api/notifications/teams/test", { method: "POST", body: {} });
}
