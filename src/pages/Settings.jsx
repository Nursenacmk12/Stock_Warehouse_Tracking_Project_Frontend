import { useCallback, useEffect, useState } from "react";
import { Button, StatusBadge } from "../components/ui/CommonUI.jsx";
import { getApiBaseUrl } from "../services/apiClient.js";
import { fetchHealth } from "../services/systemApi.js";
import "./Settings.css";

function Settings() {
  const [apiHealth, setApiHealth] = useState("checking");
  const [sapHealth, setSapHealth] = useState("checking");

  const checkHealth = useCallback(async () => {
    setApiHealth("checking");
    setSapHealth("checking");
    const [api, sap] = await Promise.all([fetchHealth("/health"), fetchHealth("/health/sap")]);
    setApiHealth(api.ok ? "healthy" : "unhealthy");
    setSapHealth(sap.ok ? "healthy" : "unhealthy");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkHealth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [checkHealth]);

  const baseUrl = getApiBaseUrl() || "Vite proxy: /api -> http://localhost:5087";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Sistem</span>
          <h1>Ayarlar</h1>
          <p>Frontend’in API ve SAP bağlantı durumunu, rol tabanlı modülleri ve çalışma ortamını izleyin.</p>
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
            <StatusBadge tone={apiHealth === "healthy" ? "success" : apiHealth === "checking" ? "warning" : "danger"}>
              {apiHealth === "healthy" ? "Aktif" : apiHealth === "checking" ? "Kontrol ediliyor" : "Hata"}
            </StatusBadge>
            <h2>API Sağlığı</h2>
          </div>
          <p className="settings-card-desc">`/health` endpoint’i üzerinden ASP.NET Core API erişimi doğrulanır.</p>
        </article>

        <article className="settings-card">
          <div className="settings-card-head">
            <StatusBadge tone={sapHealth === "healthy" ? "success" : sapHealth === "checking" ? "warning" : "danger"}>
              {sapHealth === "healthy" ? "Aktif" : sapHealth === "checking" ? "Kontrol ediliyor" : "Hata"}
            </StatusBadge>
            <h2>SAP Entegrasyonu</h2>
          </div>
          <p className="settings-card-desc">`/health/sap` endpoint’i ile SAP sağlayıcısının hazır olduğu kontrol edilir.</p>
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
