import { useState } from "react";
import { Button, StatusBadge, Toast } from "../components/ui/CommonUI.jsx";
import { syncIntegration } from "../services/integrationApi.js";
import { useIntegrations } from "../hooks/useQueries.js";
import { fetchHealthStatus } from "../services/dashboardApi.js";
import "./Settings.css";

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Bağlantılar</span>
          <h1>Entegrasyon Merkezi</h1>
          <p>SAP, bildirim ve diğer dış sistemlerin durumunu izleyin.</p>
        </div>
        <Button onClick={() => { checkHealth(); refetch(); }}>Yenile</Button>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      {health && (
        <div className="mini-grid" style={{ marginBottom: 16 }}>
          <article className="panel-card"><span className="eyebrow">API</span><h2>{health.api}</h2></article>
          <article className="panel-card"><span className="eyebrow">Veritabanı</span><h2>{health.database}</h2></article>
          <article className="panel-card"><span className="eyebrow">SAP</span><h2>{health.sap}</h2></article>
        </div>
      )}

      <div className="settings-grid">
        {isLoading ? (
          <p>Yükleniyor...</p>
        ) : (
          integrations.map((item) => (
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
                  Test bildirimi gönder
                </Button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default Integrations;
