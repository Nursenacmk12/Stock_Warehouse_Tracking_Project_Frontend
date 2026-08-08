import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { isEntraLoginAvailable } from "../services/entraAuth.js";
import "../App.css";

/**
 * MSAL redirect landing page — exchanges Entra id_token for StockGuard JWT.
 */
function AuthCallback() {
  const navigate = useNavigate();
  const { completeMicrosoftLogin, isAuthenticated } = useAuth();
  const [message, setMessage] = useState("Microsoft oturumu doğrulanıyor…");

  useEffect(() => {
    if (!isEntraLoginAvailable()) {
      setMessage("Microsoft girişi yapılandırılmamış.");
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await completeMicrosoftLogin();
      if (cancelled) return;

      if (result.redirecting) return;

      if (result.success) {
        setMessage("Giriş başarılı, yönlendiriliyorsunuz…");
        navigate("/dashboard", { replace: true });
        return;
      }

      if (result.cancelled && isAuthenticated) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setMessage(result.message || "Microsoft girişi tamamlanamadı.");
    })();

    return () => {
      cancelled = true;
    };
  }, [completeMicrosoftLogin, isAuthenticated, navigate]);

  return (
    <div className="auth-page">
      <section className="auth-card auth-card-narrow" aria-label="Microsoft giriş geri dönüşü">
        <div className="auth-form-panel">
          <div className="auth-form-header">
            <span className="eyebrow">Entra ID</span>
            <h2>Microsoft girişi</h2>
            <p role="status">{message}</p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/", { replace: true })}>
            Giriş sayfasına dön
          </button>
        </div>
      </section>
    </div>
  );
}

export default AuthCallback;
