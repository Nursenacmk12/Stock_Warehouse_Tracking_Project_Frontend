/**
 * Central SAP/live-data fallback. When fetch fails, times out, or returns empty,
 * consumers may receive mock data (if allowed) and the UI shows a mock-mode indicator.
 *
 * Policy:
 * - DEV (import.meta.env.DEV): mock allowed by default
 * - Production: mock OFF unless VITE_ALLOW_SAP_MOCK=true
 * - Explicit VITE_ALLOW_SAP_MOCK=false disables mock even in DEV
 */

const DEFAULT_TIMEOUT_MS = 8000;

/** @type {{ active: boolean, reason: string, source: string }} */
let state = { active: false, reason: "", source: "live" };

/** @type {Set<(next: typeof state) => void>} */
const listeners = new Set();

function emit() {
  const snapshot = { ...state };
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      /* ignore subscriber errors */
    }
  });
}

export function isSapMockAllowed() {
  const flag = String(import.meta.env.VITE_ALLOW_SAP_MOCK ?? "").trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  if (flag === "true" || flag === "1" || flag === "on") return true;
  return Boolean(import.meta.env.DEV);
}

export function getSapFallbackState() {
  return { ...state };
}

export function isUsingMockData() {
  return state.active;
}

export function subscribeSapFallback(listener) {
  if (typeof listener !== "function") return () => {};
  listeners.add(listener);
  listener(getSapFallbackState());
  return () => listeners.delete(listener);
}

function setMockActive(reason) {
  state = { active: true, reason: reason || "fallback", source: "mock" };
  emit();
}

function setLiveActive() {
  if (!state.active && state.source === "live") return;
  state = { active: false, reason: "", source: "live" };
  emit();
}

function withTimeout(promise, timeoutMs) {
  if (!timeoutMs || timeoutMs <= 0) return promise;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("SAP veri zaman aşımı"));
    }, timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isEmptyResult(data, isEmpty) {
  if (typeof isEmpty === "function") return Boolean(isEmpty(data));
  if (data == null) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === "object") {
    if (Array.isArray(data.items)) return data.items.length === 0 && Number(data.totalCount ?? 0) === 0;
  }
  return false;
}

/**
 * @template T
 * @param {() => Promise<T>} fetcher
 * @param {() => T} mockFactory
 * @param {{ timeoutMs?: number, isEmpty?: (data: T) => boolean, label?: string }} [options]
 * @returns {Promise<T>}
 */
export async function withSapMockFallback(fetcher, mockFactory, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const allowMock = isSapMockAllowed();

  try {
    const data = await withTimeout(Promise.resolve().then(fetcher), timeoutMs);
    if (isEmptyResult(data, options.isEmpty)) {
      const reason = options.label ? `${options.label}:empty` : "empty";
      if (!allowMock) {
        setMockActive(reason);
        throw new Error(
          `Canlı SAP verisi boş (${reason}). Mock kapalı — VITE_ALLOW_SAP_MOCK veya geliştirme ortamı gerekli.`,
        );
      }
      setMockActive(reason);
      return mockFactory();
    }
    setLiveActive();
    return data;
  } catch (error) {
    const alreadyFailLoud =
      error instanceof Error && /Mock kapalı|Canlı SAP verisi boş/i.test(error.message);
    if (alreadyFailLoud) throw error;

    const reason =
      error instanceof Error && /zaman aşımı|timeout/i.test(error.message)
        ? options.label
          ? `${options.label}:timeout`
          : "timeout"
        : options.label
          ? `${options.label}:error`
          : "error";

    if (!allowMock) {
      setMockActive(reason);
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Canlı SAP verisi alınamadı (${reason}): ${detail}`);
    }

    setMockActive(reason);
    return mockFactory();
  }
}
