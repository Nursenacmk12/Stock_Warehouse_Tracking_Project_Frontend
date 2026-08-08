import { useState } from "react";
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
import "./Settings.css";

const integrationEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

function Integrations() {
  const { data: integrations = [], refetch, isLoading } = useIntegrations();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState("");

  const checkHealth = async () => {
    try {
      const status = await fetchHealthStatus();
      setHealth(status);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleSync = async (name) => {
    setBusy(name);
    try {
      await syncIntegration(name);
      setMessage({ type: "success", text: `${name} senkronizasyonu tamamlandı.` });
      await refetch();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy("");
    }
  };

  const refreshAll = () => {
    checkHealth();
    refetch();
  };

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

      {health && (
        <div className="stats-grid">
          <KpiCard label="API" value={health.api} tone="blue" />
          <KpiCard label="Veritabanı" value={health.database} tone="green" />
          <KpiCard label="SAP" value={health.sap} tone="amber" />
          <KpiCard label="Entegrasyon" value={integrations.length} tone="red" />
        </div>
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
          {integrations.map((item) => (
            <article className="settings-card" key={item.name}>
              <div className="settings-card-head">
                <StatusBadge tone={item.status === "healthy" || item.status === "configured" ? "success" : "warning"}>
                  {item.status}
                </StatusBadge>
                <h2>{item.name}</h2>
              </div>
              <p className="settings-card-desc">{item.description ?? "—"}</p>
              {item.name === "SendGrid" && (
                <Button onClick={() => handleSync(item.name)} disabled={busy === item.name}>
                  {busy === item.name ? "Gönderiliyor..." : "Test bildirimi gönder"}
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Integrations;
