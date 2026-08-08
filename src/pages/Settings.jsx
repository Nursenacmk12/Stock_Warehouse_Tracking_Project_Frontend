import { useCallback, useEffect, useState } from "react";
import { Button, StatusBadge, TextInput, Toast } from "../components/ui/CommonUI.jsx";
import { getApiBaseUrl } from "../services/apiClient.js";
import { fetchHealthStatus } from "../services/dashboardApi.js";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "../services/integrationApi.js";
import "./Settings.css";

function Settings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    emailEnabled: false,
    alertEmail: "",
    weeklyReportEnabled: false,
    weeklyReportDay: "Monday",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const checkHealth = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchHealthStatus();
      setHealth(status);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrefs = useCallback(async () => {
    try {
      const data = await fetchNotificationPreferences();
      setPrefs({
        emailEnabled: Boolean(data.emailEnabled),
        alertEmail: data.alertEmail ?? "",
        weeklyReportEnabled: Boolean(data.weeklyReportEnabled),
        weeklyReportDay: data.weeklyReportDay ?? "Monday",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    loadPrefs();
  }, [checkHealth, loadPrefs]);

  const savePrefs = async () => {
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences(prefs);
      setPrefs({
        emailEnabled: Boolean(updated.emailEnabled),
        alertEmail: updated.alertEmail ?? "",
        weeklyReportEnabled: Boolean(updated.weeklyReportEnabled),
        weeklyReportDay: updated.weeklyReportDay ?? "Monday",
      });
      setMessage({ type: "success", text: "Bildirim tercihleri kaydedildi." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const baseUrl = getApiBaseUrl() || "Vite proxy: /api -> http://localhost:5087";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Sistem</span>
          <h1>Ayarlar</h1>
          <p>Bağlantı sağlığı ve e-posta bildirim tercihlerini yönetin.</p>
        </div>
        <Button onClick={checkHealth}>Bağlantıları Kontrol Et</Button>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

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

      <article className="card settings-notify">
        <div className="card-header">
          <div>
            <h2>E-posta bildirimleri</h2>
            <p>Kritik stok ve haftalık rapor tercihleri veritabanında saklanır.</p>
          </div>
          <Button variant="primary" onClick={savePrefs} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
        <div className="settings-notify-grid">
          <label className="check-row">
            <input
              type="checkbox"
              checked={prefs.emailEnabled}
              onChange={(e) => setPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))}
            />
            E-posta bildirimleri açık
          </label>
          <TextInput
            label="Bildirim / rapor e-postası"
            type="email"
            value={prefs.alertEmail}
            onChange={(e) => setPrefs((p) => ({ ...p, alertEmail: e.target.value }))}
          />
          <label className="check-row">
            <input
              type="checkbox"
              checked={prefs.weeklyReportEnabled}
              onChange={(e) => setPrefs((p) => ({ ...p, weeklyReportEnabled: e.target.checked }))}
            />
            Haftalık otomatik rapor
          </label>
          <label className="form-group">
            <span>Haftalık rapor günü</span>
            <select
              value={prefs.weeklyReportDay}
              onChange={(e) => setPrefs((p) => ({ ...p, weeklyReportDay: e.target.value }))}
            >
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>
    </div>
  );
}

export default Settings;
