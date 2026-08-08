import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth.js";
import { isEntraLoginAvailable, probeEntraApiConfig } from "./services/entraAuth.js";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const { login, loginWithMicrosoft } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msSubmitting, setMsSubmitting] = useState(false);
  const entraConfigured = isEntraLoginAvailable();
  const [entraApiEnabled, setEntraApiEnabled] = useState(null);

  useEffect(() => {
    if (!entraConfigured) {
      setEntraApiEnabled(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const res = await probeEntraApiConfig();
      if (cancelled) return;
      if (res.ok) {
        setEntraApiEnabled(Boolean(res.data?.enabled));
      } else {
        // API unreachable — still show the button; click will surface errors.
        setEntraApiEnabled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entraConfigured]);

  const showMicrosoftButton = entraConfigured;
  const microsoftDisabled = msSubmitting || submitting || entraApiEnabled === false;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setMessage({ type: "error", text: "Lütfen e-posta ve şifre alanlarını doldurun." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    const result = await login(formData.email, formData.password);

    setSubmitting(false);

    if (result.success) {
      setMessage({ type: "success", text: "Giriş başarılı, yönlendiriliyorsunuz." });
      navigate("/dashboard");
      return;
    }

    setMessage({
      type: "error",
      text: result.message || "E-posta veya şifre hatalı.",
    });
  };

  const handleMicrosoftLogin = async () => {
    setMsSubmitting(true);
    setMessage({ type: "", text: "" });

    const result = await loginWithMicrosoft();
    if (!result.success) {
      setMsSubmitting(false);
      setMessage({
        type: "error",
        text: result.message || "Microsoft girişi başlatılamadı.",
      });
      return;
    }
    // Redirect in progress — leave button in loading state.
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-label="StockGuard giriş formu">
        <div className="auth-brand-panel">
          <img className="brand-mark brand-mark-logo" src="/stockguard-icon.png" alt="" />
          <div>
            <p className="eyebrow">Depo ve stok yönetimi</p>
            <h1>StockGuard</h1>
            <p className="auth-lead">
              Ürünleri, kritik stokları ve depo hareketlerini tek panelden düzenli şekilde takip edin.
            </p>
          </div>
          <div className="auth-highlights">
            <span>Kritik stok uyarıları</span>
            <span>Hareket geçmişi</span>
            <span>Hızlı ürün yönetimi</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <span className="eyebrow">Hesap girişi</span>
            <h2>Giriş Yap</h2>
            <p>Devam etmek için kayıtlı e-posta adresiniz ve şifrenizle giriş yapın.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="ornek@mail.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            {message.text && (
              <div className={`message ${message.type}`} role="status">
                {message.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting || msSubmitting}>
              {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          {showMicrosoftButton && (
            <div className="auth-sso">
              <div className="auth-sso-divider" role="separator">
                <span>veya</span>
              </div>
              <button
                type="button"
                className="btn btn-microsoft"
                onClick={handleMicrosoftLogin}
                disabled={microsoftDisabled}
                title={
                  entraApiEnabled === false
                    ? "API tarafında Entra SSO kapalı (Authentication:Entra:Enabled)."
                    : "Microsoft Entra ID ile giriş"
                }
              >
                <MicrosoftGlyph />
                {msSubmitting
                  ? "Microsoft’a yönlendiriliyor…"
                  : entraApiEnabled === false
                    ? "Microsoft girişi (API kapalı)"
                    : "Microsoft ile giriş"}
              </button>
              {entraApiEnabled === false && (
                <p className="auth-sso-hint muted-text">
                  Frontend env dolu; API’de <code>Authentication:Entra:Enabled=true</code> ve TenantId/ClientId
                  ayarlanmalı.
                </p>
              )}
            </div>
          )}

          <div className="form-footer">
            <p>Hesap oluşturmak için sistem yöneticinize başvurun.</p>
            {import.meta.env.DEV && (
              <p className="muted-text" style={{ marginTop: 12 }}>
                Geliştirme ortamı: API <code>http://localhost:5087</code> üzerinde çalışmalıdır.
                Varsayılan SuperAdmin: <code>ahmet@superadmin.com</code> / <code>Admin123!</code>
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MicrosoftGlyph() {
  return (
    <svg className="microsoft-glyph" width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

export default App;
