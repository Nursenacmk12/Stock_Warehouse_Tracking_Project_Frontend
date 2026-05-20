import { request } from "./apiClient.js";
import { normalizePagedResult } from "./movementApi.js";

export function normalizeLog(log = {}) {
  return {
    id: Number(log.logId ?? log.id ?? 0),
    logId: Number(log.logId ?? log.id ?? 0),
    userId: Number(log.userId ?? 0),
    userName: log.userName ?? "",
    action: log.action ?? "",
    entity: log.entity ?? "",
    details: log.details ?? "",
    timestamp: log.timestamp ?? null,
    isSuccess: Boolean(log.isSuccess),
    errorMessage: log.errorMessage ?? "",
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
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    },
  });
  const paged = normalizePagedResult(data);
  return { ...paged, items: paged.items.map(normalizeLog) };
}
