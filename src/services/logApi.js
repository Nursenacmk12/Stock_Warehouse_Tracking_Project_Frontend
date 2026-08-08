import { request, getApiBaseUrl } from "./apiClient.js";
import { normalizePagedResult } from "./movementApi.js";

export function normalizeLog(log = {}) {
  return {
    id: Number(log.logId ?? log.id ?? 0),
    logId: Number(log.logId ?? log.id ?? 0),
    userId: Number(log.userId ?? 0),
    userName: log.userName ?? "",
    actorUserId: log.actorUserId ?? null,
    actorUserName: log.actorUserName ?? "",
    action: log.action ?? "",
    entity: log.entity ?? "",
    details: log.details ?? "",
    timestamp: log.timestamp ?? null,
    isSuccess: Boolean(log.isSuccess),
    errorMessage: log.errorMessage ?? "",
    source: log.source ?? "User",
    severity: log.severity ?? "Info",
  };
}

export async function fetchLogs(filters = {}) {
  const data = await request("/api/logs", {
    query: {
      userId: filters.userId,
      action: filters.action,
      entity: filters.entity,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      isSuccess: filters.isSuccess,
      source: filters.source,
      severity: filters.severity,
      q: filters.q,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
  const paged = normalizePagedResult(data);
  return { ...paged, items: paged.items.map(normalizeLog) };
}

export async function fetchLogById(id) {
  const data = await request(`/api/logs/${id}`);
  return normalizeLog(data);
}

export async function fetchLogMeta() {
  return request("/api/logs/meta");
}

export async function downloadLogsExport(filters = {}) {
  const base = getApiBaseUrl();
  const token = localStorage.getItem("stock_auth_token");
  const params = new URLSearchParams();
  Object.entries({
    userId: filters.userId,
    action: filters.action,
    entity: filters.entity,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    isSuccess: filters.isSuccess,
    source: filters.source,
    severity: filters.severity,
    q: filters.q,
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const url = `${base}/api/logs/export?${params.toString()}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Log dışa aktarılamadı.");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "event-logs.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
