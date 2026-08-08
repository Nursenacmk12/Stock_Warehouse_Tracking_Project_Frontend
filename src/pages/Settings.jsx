import { useCallback, useEffect, useState } from "react";
import { Button, StatusBadge, TextInput, Toast } from "../components/ui/CommonUI.jsx";
import { getApiBaseUrl } from "../services/apiClient.js";
import { fetchHealthStatus } from "../services/dashboardApi.js";
import {
  fetchNotificationPreferences,
  fetchSlackSettings,
  fetchSmtpSettings,
  fetchTeamsSettings,
  testSlackSettings,
  testSmtpSettings,
  testTeamsSettings,
  updateNotificationPreferences,
  updateSlackSettings,
  updateSmtpSettings,
  updateTeamsSettings,
} from "../services/integrationApi.js";
import "./Settings.css";

const defaultSmtp = {
  enabled: false,
  host: "",
  port: 587,
  useSsl: true,
  userName: "",
  password: "",
  fromEmail: "",
  fromName: "",
  hasPassword: false,
};

const defaultWebhook = {
  enabled: false,
  hasWebhookUrl: false,
  webhookUrlMasked: "",
  webhookUrl: "",
};

function Settings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    emailEnabled: false,
    alertEmail: "",
    weeklyReportEnabled: false,
    weeklyReportDay: "Monday",
  });
  const [smtp, setSmtp] = useState(defaultSmtp);
  const [smtpAvailable, setSmtpAvailable] = useState(true);
  const [slack, setSlack] = useState(defaultWebhook);
  const [teams, setTeams] = useState(defaultWebhook);
  const [webhooksAvailable, setWebhooksAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingSlack, setSavingSlack] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [savingTeams, setSavingTeams] = useState(false);
  const [testingTeams, setTestingTeams] = useState(false);
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

  const loadSmtp = useCallback(async () => {
    try {
      const data = await fetchSmtpSettings();
      setSmtp({
        ...defaultSmtp,
        ...data,
        password: "",
      });
      setSmtpAvailable(true);
    } catch (error) {
      setSmtpAvailable(false);
      if (error?.status !== 404) {
        setMessage({
          type: "error",
          text: error.message || "SMTP ayarları yüklenemedi.",
        });
      }
    }
  }, []);

  const loadWebhooks = useCallback(async () => {
    try {
      const [slackData, teamsData] = await Promise.all([fetchSlackSettings(), fetchTeamsSettings()]);
      setSlack({ ...defaultWebhook, ...slackData, webhookUrl: "" });
      setTeams({ ...defaultWebhook, ...teamsData, webhookUrl: "" });
      setWebhooksAvailable(true);
    } catch (error) {
      setWebhooksAvailable(false);
      if (error?.status !== 404) {
        setMessage({
          type: "error",
          text: error.message || "Webhook ayarları yüklenemedi.",
        });
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    loadPrefs();
    loadSmtp();
    loadWebhooks();
  }, [checkHealth, loadPrefs, loadSmtp, loadWebhooks]);

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

  const saveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const updated = await updateSmtpSettings(smtp);
      setSmtp({
        ...defaultSmtp,
        ...updated,
        password: "",
      });
      setSmtpAvailable(true);
      setMessage({ type: "success", text: "SMTP ayarları kaydedildi." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.status === 404
            ? "SMTP API uç noktası henüz yok. Backend’de /api/notifications/smtp eklenmeli."
            : error.message,
      });
    } finally {
      setSavingSmtp(false);
    }
  };

  const testSmtp = async () => {
    setTestingSmtp(true);
    try {
      const result = await testSmtpSettings({ to: prefs.alertEmail || smtp.fromEmail });
      if (result?.sent === false) {
        setMessage({
          type: "error",
          text: result?.message || "SMTP test e-postası gönderilemedi.",
        });
        return;
      }
      setMessage({
        type: "success",
        text: result?.message || "SMTP test e-postası gönderildi.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.status === 404
            ? "SMTP test uç noktası henüz yok. Backend’de /api/notifications/smtp/test eklenmeli."
            : error.message,
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const saveSlack = async () => {
    setSavingSlack(true);
    try {
      const updated = await updateSlackSettings(slack);
      setSlack({ ...defaultWebhook, ...updated, webhookUrl: "" });
      setWebhooksAvailable(true);
      setMessage({ type: "success", text: "Slack webhook ayarları kaydedildi." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.status === 404
            ? "Slack API uç noktası henüz yok. Backend’de /api/notifications/slack eklenmeli."
            : error.message,
      });
    } finally {
      setSavingSlack(false);
    }
  };

  const testSlack = async () => {
    setTestingSlack(true);
    try {
      const result = await testSlackSettings();
      if (result?.sent === false) {
        setMessage({ type: "error", text: result?.message || "Slack test mesajı gönderilemedi." });
        return;
      }
      setMessage({ type: "success", text: result?.message || "Slack test mesajı gönderildi." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.status === 404 ? "Slack test uç noktası henüz yok." : error.message,
      });
    } finally {
      setTestingSlack(false);
    }
  };

  const saveTeams = async () => {
    setSavingTeams(true);
    try {
      const updated = await updateTeamsSettings(teams);
      setTeams({ ...defaultWebhook, ...updated, webhookUrl: "" });
      setWebhooksAvailable(true);
      setMessage({ type: "success", text: "Teams webhook ayarları kaydedildi." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.status === 404
            ? "Teams API uç noktası henüz yok. Backend’de /api/notifications/teams eklenmeli."
            : error.message,
      });
    } finally {
      setSavingTeams(false);
    }
  };

  const testTeams = async () => {
    setTestingTeams(true);
    try {
      const result = await testTeamsSettings();
      if (result?.sent === false) {
        setMessage({ type: "error", text: result?.message || "Teams test mesajı gönderilemedi." });
        return;
      }
      setMessage({ type: "success", text: result?.message || "Teams test mesajı gönderildi." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.status === 404 ? "Teams test uç noktası henüz yok." : error.message,
      });
    } finally {
      setTestingTeams(false);
    }
  };

  const baseUrl = getApiBaseUrl() || "Vite proxy: /api -> http://localhost:5087";

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Sistem</span>
          <h1>Ayarlar</h1>
          <p>Bağlantı sağlığı, e-posta, SMTP ve chat webhook bildirimlerini yönetin.</p>
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
            <StatusBadge
              tone={
                loading
                  ? "warning"
                  : health?.sap === "healthy"
                    ? "success"
                    : health?.sap === "mock"
                      ? "warning"
                      : "danger"
              }
            >
              {loading
                ? "Kontrol ediliyor"
                : health?.sap === "healthy"
                  ? "Aktif"
                  : health?.sap === "mock"
                    ? "Mock"
                    : "Hata"}
            </StatusBadge>
            <h2>SAP Entegrasyonu</h2>
          </div>
          <p className="settings-card-desc">
            {health?.sap === "mock"
              ? "SAP provider Mock — örnek veri (canlı değil)."
              : "SAP provider health check sonucu."}
          </p>
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
        <div className="settings-notify-body">
          <div className="settings-toggle-row">
            <label className="check-row">
              <input
                type="checkbox"
                checked={prefs.emailEnabled}
                onChange={(e) => setPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))}
              />
              E-posta bildirimleri açık
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={prefs.weeklyReportEnabled}
                onChange={(e) => setPrefs((p) => ({ ...p, weeklyReportEnabled: e.target.checked }))}
              />
              Haftalık otomatik rapor
            </label>
          </div>
          <div className="settings-fields-grid">
            <TextInput
              label="Bildirim / rapor e-postası"
              type="email"
              value={prefs.alertEmail}
              onChange={(e) => setPrefs((p) => ({ ...p, alertEmail: e.target.value }))}
            />
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
        </div>
      </article>

      <article className="card settings-notify">
        <div className="card-header">
          <div>
            <h2>SMTP gönderimi</h2>
            <p>
              Rapor ve bildirimleri kurumsal SMTP ile gönderin. Parola alanı boş bırakılırsa mevcut gizli değer
              korunur; sunucu tarafında env/secure store kullanın.
            </p>
          </div>
          <div className="operation-actions">
            <Button onClick={testSmtp} disabled={testingSmtp || !smtpAvailable}>
              {testingSmtp ? "Test ediliyor..." : "Test gönder"}
            </Button>
            <Button variant="primary" onClick={saveSmtp} disabled={savingSmtp}>
              {savingSmtp ? "Kaydediliyor..." : "SMTP kaydet"}
            </Button>
          </div>
        </div>

        <div className="settings-notify-body">
          {!smtpAvailable && (
            <div className="settings-smtp-hint" role="status">
              <strong>SMTP API henüz bağlı değil</strong>
              <p>
                Backend SMTP uç noktası bulunamadı. Beklenen sözleşme:{" "}
                <code>GET/PUT /api/notifications/smtp</code> ve <code>POST /api/notifications/smtp/test</code>.
                Ortam değişkenleri örneği: <code>Integrations__Smtp__Host</code>,{" "}
                <code>Integrations__Smtp__Port</code>, <code>Integrations__Smtp__UserName</code>,{" "}
                <code>Integrations__Smtp__Password</code>, <code>Integrations__Smtp__FromEmail</code>.
              </p>
            </div>
          )}

          <div className="settings-toggle-row">
            <label className="check-row">
              <input
                type="checkbox"
                checked={smtp.enabled}
                onChange={(e) => setSmtp((p) => ({ ...p, enabled: e.target.checked }))}
              />
              SMTP sağlayıcısını etkinleştir
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={smtp.useSsl}
                onChange={(e) => setSmtp((p) => ({ ...p, useSsl: e.target.checked }))}
              />
              SSL / TLS kullan
            </label>
          </div>

          <div className="settings-fields-grid">
            <TextInput
              label="SMTP sunucu (host)"
              value={smtp.host}
              onChange={(e) => setSmtp((p) => ({ ...p, host: e.target.value }))}
              placeholder="smtp.firma.com"
            />
            <TextInput
              label="Port"
              type="number"
              min={1}
              max={65535}
              value={smtp.port}
              onChange={(e) => setSmtp((p) => ({ ...p, port: Number(e.target.value) || 587 }))}
            />
            <TextInput
              label="Kullanıcı adı"
              value={smtp.userName}
              onChange={(e) => setSmtp((p) => ({ ...p, userName: e.target.value }))}
              autoComplete="off"
            />
            <TextInput
              label={smtp.hasPassword ? "Parola (değiştirmek için yazın)" : "Parola"}
              type="password"
              value={smtp.password}
              onChange={(e) => setSmtp((p) => ({ ...p, password: e.target.value }))}
              placeholder={smtp.hasPassword ? "••••••••" : ""}
              autoComplete="new-password"
            />
            <TextInput
              label="Gönderen e-posta"
              type="email"
              value={smtp.fromEmail}
              onChange={(e) => setSmtp((p) => ({ ...p, fromEmail: e.target.value }))}
              placeholder="noreply@firma.com"
            />
            <TextInput
              label="Gönderen adı"
              value={smtp.fromName}
              onChange={(e) => setSmtp((p) => ({ ...p, fromName: e.target.value }))}
              placeholder="StockGuard"
            />
          </div>
        </div>
      </article>

      <article className="card settings-notify">
        <div className="card-header">
          <div>
            <h2>Slack webhook</h2>
            <p>
              Kritik stok uyarılarını Slack kanalına gönderin. URL alanı boş bırakılırsa mevcut gizli değer korunur;
              GET yanıtında yalnızca maskelenmiş URL görünür.
            </p>
          </div>
          <div className="operation-actions">
            <Button onClick={testSlack} disabled={testingSlack || !webhooksAvailable}>
              {testingSlack ? "Test ediliyor..." : "Test gönder"}
            </Button>
            <Button variant="primary" onClick={saveSlack} disabled={savingSlack}>
              {savingSlack ? "Kaydediliyor..." : "Slack kaydet"}
            </Button>
          </div>
        </div>
        <div className="settings-notify-body">
          {!webhooksAvailable && (
            <div className="settings-smtp-hint" role="status">
              <strong>Webhook API henüz bağlı değil</strong>
              <p>
                Beklenen sözleşme: <code>GET/PUT /api/notifications/slack</code>,{" "}
                <code>POST /api/notifications/slack/test</code>. Env:{" "}
                <code>Integrations__Slack__WebhookUrl</code>, <code>Integrations__Slack__Enabled</code>.
              </p>
            </div>
          )}
          <div className="settings-toggle-row">
            <label className="check-row">
              <input
                type="checkbox"
                checked={slack.enabled}
                onChange={(e) => setSlack((p) => ({ ...p, enabled: e.target.checked }))}
              />
              Slack webhook etkin
            </label>
          </div>
          <div className="settings-fields-grid">
            <TextInput
              label={slack.hasWebhookUrl ? "Webhook URL (değiştirmek için yazın)" : "Webhook URL"}
              type="password"
              value={slack.webhookUrl}
              onChange={(e) => setSlack((p) => ({ ...p, webhookUrl: e.target.value }))}
              placeholder={
                slack.hasWebhookUrl ? slack.webhookUrlMasked || "••••••••" : "https://hooks.slack.com/services/..."
              }
              autoComplete="off"
            />
            {slack.hasWebhookUrl && slack.webhookUrlMasked ? (
              <p className="settings-masked-url" title="Sunucuda saklanan URL (maskeli)">
                Kayıtlı: <code>{slack.webhookUrlMasked}</code>
              </p>
            ) : null}
          </div>
        </div>
      </article>

      <article className="card settings-notify">
        <div className="card-header">
          <div>
            <h2>Microsoft Teams webhook</h2>
            <p>
              Kritik stok uyarılarını Teams kanalına gönderin. Incoming Webhook URL’si write-only; GET’te maskelenir.
            </p>
          </div>
          <div className="operation-actions">
            <Button onClick={testTeams} disabled={testingTeams || !webhooksAvailable}>
              {testingTeams ? "Test ediliyor..." : "Test gönder"}
            </Button>
            <Button variant="primary" onClick={saveTeams} disabled={savingTeams}>
              {savingTeams ? "Kaydediliyor..." : "Teams kaydet"}
            </Button>
          </div>
        </div>
        <div className="settings-notify-body">
          <div className="settings-toggle-row">
            <label className="check-row">
              <input
                type="checkbox"
                checked={teams.enabled}
                onChange={(e) => setTeams((p) => ({ ...p, enabled: e.target.checked }))}
              />
              Teams webhook etkin
            </label>
          </div>
          <div className="settings-fields-grid">
            <TextInput
              label={teams.hasWebhookUrl ? "Webhook URL (değiştirmek için yazın)" : "Webhook URL"}
              type="password"
              value={teams.webhookUrl}
              onChange={(e) => setTeams((p) => ({ ...p, webhookUrl: e.target.value }))}
              placeholder={
                teams.hasWebhookUrl
                  ? teams.webhookUrlMasked || "••••••••"
                  : "https://outlook.office.com/webhook/..."
              }
              autoComplete="off"
            />
            {teams.hasWebhookUrl && teams.webhookUrlMasked ? (
              <p className="settings-masked-url" title="Sunucuda saklanan URL (maskeli)">
                Kayıtlı: <code>{teams.webhookUrlMasked}</code>
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </div>
  );
}

export default Settings;
