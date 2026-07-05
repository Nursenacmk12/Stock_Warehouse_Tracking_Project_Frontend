import { useCallback, useEffect, useState } from "react";
import { Button, StatusBadge } from "../components/ui/CommonUI.jsx";
import { getApiBaseUrl } from "../services/apiClient.js";
import { fetchHealthStatus } from "../services/dashboardApi.js";
import "./Settings.css";

function Settings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchHealthStatus();
      setHealth(status);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const baseUrl = getApiBaseUrl() || "Vite proxy: /api -> http://localhost:5087";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Sistem</span>
          <h1>Ayarlar</h1>
          <p>Frontend'in API, veritabanı ve SAP bağlantı durumunu izleyin.</p>
        </div>
        <Button onClick={checkHealth}>Bağlantıları Kontrol Et</Button>
      </div>

      <div className="settings-intro card">
        <div className="settings-intro-inner">
          <span className="settings-intro-badge">API</span>
          <h2>Gerçek backend entegrasyonu aktif</h2>
          <p>{baseUrl}</p>
        </div>
      </div>

      <div className="settings-grid">
        <article className="settings-card">
          <div className="settings-card-head">
            <StatusBadge tone={health?.api === "healthy" ? "success" : loading ? "warning" : "danger"}>
              {loading ? "Kontrol ediliyor" : health?.api === "healthy" ? "Aktif" : "Hata"}
            </StatusBadge>
            <h2>API Sağlığı</h2>
          </div>
          <p className="settings-card-desc">Composite health endpoint ile API erişimi doğrulanır.</p>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <StatusBadge tone={health?.database === "healthy" ? "success" : loading ? "warning" : "danger"}>
              {loading ? "Kontrol ediliyor" : health?.database === "healthy" ? "Aktif" : "Hata"}
            </StatusBadge>
            <h2>Veritabanı</h2>
          </div>
          <p className="settings-card-desc">SQL Server bağlantı durumu.</p>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <StatusBadge tone={health?.sap === "healthy" ? "success" : loading ? "warning" : "danger"}>
              {loading ? "Kontrol ediliyor" : health?.sap === "healthy" ? "Aktif" : "Hata"}
            </StatusBadge>
            <h2>SAP Entegrasyonu</h2>
          </div>
          <p className="settings-card-desc">SAP provider health check sonucu.</p>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <StatusBadge tone="info">RBAC</StatusBadge>
            <h2>Rol Bazlı Erişim</h2>
          </div>
          <p className="settings-card-desc">
            Kullanıcı yönetimi SuperAdmin, depo yönetimi Admin/SuperAdmin, stok operasyonları yetkili depo rolleriyle
            sınırlandırıldı.
          </p>
        </article>
      </div>
    </div>
  );
}

export default Settings;
