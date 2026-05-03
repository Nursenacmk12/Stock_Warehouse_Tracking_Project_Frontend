import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/useAuth.js";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="auth-page">
      <section className="auth-card" aria-label="Stok takip sistemi giriş formu">
        <div className="auth-brand-panel">
          <div className="brand-mark">ST</div>
          <div>
            <p className="eyebrow">Depo ve stok yönetimi</p>
            <h1>Stok Takip Sistemi</h1>
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

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <div className="form-footer">
            <p>Hesap oluşturmak için sistem yöneticinize başvurun.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
