import { useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  KpiCard,
  LoadingState,
  StatusBadge,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { syncIntegration } from "../services/integrationApi.js";
import { useIntegrations } from "../hooks/useQueries.js";
import { fetchHealthStatus } from "../services/dashboardApi.js";
import { getSapFallbackState, subscribeSapFallback } from "../services/sapFallback.js";
import { ApiError } from "../services/apiClient.js";
import "./Settings.css";

const integrationEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

function formatSyncAt(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("tr-TR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function statusTone(status) {
  const s = String(status ?? "").toLowerCase();
  if (s === "healthy" || s === "configured") return "success";
  if (s === "mock") return "warning";
  if (s === "unhealthy" || s === "error" || s === "not_configured") return "danger";
  return "warning";
}

function Integrations() {
  const { data: integrations = [], refetch, isLoading } = useIntegrations();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState("");
  const [feMock, setFeMock] = useState(() => getSapFallbackState());

  useEffect(() => subscribeSapFallback(setFeMock), []);

  const checkHealth = async () => {
    try {
      const status = await fetchHealthStatus();
      setHealth(status);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSync = async (name) => {
    setBusy(name);
    try {
      const result = await syncIntegration(name);
      const detail = result?.message || `${name} senkronizasyonu tamamlandı.`;
      const mockNote = result?.isMock ? " (mock — canlı SAP değil)" : "";
      setMessage({ type: "success", text: `${detail}${mockNote}` });
      await Promise.all([refetch(), checkHealth()]);
    } catch (error) {
      const data = error instanceof ApiError ? error.data : null;
      const detail =
        (data && typeof data === "object" && (data.error || data.message)) ||
        error.message ||
        "Senkronizasyon başarısız.";
      setMessage({ type: "error", text: String(detail) });
      await refetch();
    } finally {
      setBusy("");
    }
  };

  const refreshAll = () => {
    checkHealth();
    refetch();
  };

  const sapRow = integrations.find((i) => String(i.name).toUpperCase() === "SAP");
  const sapKpiValue =
    sapRow?.status ||
    health?.sap ||
    (feMock.active ? "mock-fe" : "—");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Bağlantılar</span>
          <h1>Entegrasyon Merkezi</h1>
          <p>SAP, bildirim ve diğer dış sistemlerin durumunu izleyin.</p>
        </div>
        <Button onClick={refreshAll}>Yenile</Button>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      {(health || sapRow || feMock.active) && (
        <div className="stats-grid">
          <KpiCard label="API" value={health?.api ?? "—"} tone="blue" />
          <KpiCard label="Veritabanı" value={health?.database ?? "—"} tone="green" />
          <KpiCard label="SAP" value={sapKpiValue} tone="amber" />
          <KpiCard label="Entegrasyon" value={integrations.length} tone="red" />
        </div>
      )}

      {feMock.active && (
        <p className="integration-mock-callout" role="status">
          Frontend mock aktif
          {feMock.reason ? (
            <>
              {" "}
              (<code>{feMock.reason}</code>)
            </>
          ) : null}
          . SAP sync sonucu canlı veri anlamına gelmez; banner’ı kontrol edin.
        </p>
      )}

      {isLoading ? (
        <LoadingState text="Entegrasyonlar yükleniyor..." />
      ) : integrations.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={integrationEmptyIcon}
            title="Entegrasyon bulunamadı"
            text="API entegrasyon listesi boş döndü."
            action={<Button onClick={refreshAll}>Yenile</Button>}
          />
        </div>
      ) : (
        <div className="settings-grid">
          {integrations.map((item) => {
            const isSap = String(item.name).toUpperCase() === "SAP";
            const isSendGrid = item.name === "SendGrid";
            const isSmtp = item.name === "Smtp" || item.name === "SMTP";
            const displayStatus =
              isSap && item.isMock
                ? "mock"
                : isSap && feMock.active && item.status === "healthy"
                  ? "mock-fe"
                  : item.status;

            return (
              <article className="settings-card" key={item.name}>
                <div className="settings-card-head">
                  <StatusBadge tone={statusTone(displayStatus)}>{displayStatus}</StatusBadge>
                  <h2>{item.name}</h2>
                </div>
                <p className="settings-card-desc">{item.description ?? "—"}</p>

                {isSap && (
                  <dl className="integration-meta">
                    <div>
                      <dt>Provider</dt>
                      <dd>{item.provider ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Son sync</dt>
                      <dd>{formatSyncAt(item.lastSyncAt)}</dd>
                    </div>
                    {item.lastSyncMessage ? (
                      <div className="integration-meta-wide">
                        <dt>Mesaj</dt>
                        <dd>{item.lastSyncMessage}</dd>
                      </div>
                    ) : null}
                    {item.lastError ? (
                      <div className="integration-meta-wide">
                        <dt>Hata</dt>
                        <dd className="integration-meta-error">{item.lastError}</dd>
                      </div>
                    ) : null}
                  </dl>
                )}

                {isSap && (
                  <Button onClick={() => handleSync(item.name)} disabled={busy === item.name}>
                    {busy === item.name ? "Senkronize ediliyor..." : "Senkronize et"}
                  </Button>
                )}
                {isSendGrid && (
                  <Button onClick={() => handleSync(item.name)} disabled={busy === item.name}>
                    {busy === item.name ? "Gönderiliyor..." : "Test bildirimi gönder"}
                  </Button>
                )}
                {isSmtp && (
                  <Button onClick={() => handleSync(item.name)} disabled={busy === item.name}>
                    {busy === item.name ? "Test ediliyor..." : "SMTP test gönder"}
                  </Button>
                )}
                {(item.name === "Slack" || item.name === "Teams") && (
                  <Button onClick={() => handleSync(item.name)} disabled={busy === item.name}>
                    {busy === item.name ? "Test ediliyor..." : `${item.name} test gönder`}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Integrations;
