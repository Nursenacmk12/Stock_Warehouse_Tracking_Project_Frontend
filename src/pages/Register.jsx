import { useState } from "react";
import { Link } from "react-router-dom";
import { registerWithApi } from "../services/authApi.js";
import "../App.css";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Ad soyad alanı zorunludur.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-posta alanı zorunludur.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Geçerli bir e-posta adresi girin.";
    }

    if (!formData.password) {
      newErrors.password = "Şifre alanı zorunludur.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Şifre onayı zorunludur.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Şifreler eşleşmiyor.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    const apiResult = await registerWithApi({
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      roleId: 2,
    });

    setSubmitting(false);

    if (!apiResult.ok) {
      setMessage({ type: "error", text: apiResult.message });
      return;
    }

    setMessage({
      type: "success",
      text: apiResult.message || "Kayıt başarılı. Şimdi giriş yapabilirsiniz.",
    });
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-label="Stok takip sistemi kayıt formu">
        <div className="auth-brand-panel">
          <div className="brand-mark">ST</div>
          <div>
            <p className="eyebrow">Yeni hesap</p>
            <h1>Stok Takip Sistemi</h1>
            <p className="auth-lead">
              Stok süreçlerinizi daha net, izlenebilir ve düzenli yönetmek için hesabınızı oluşturun.
            </p>
          </div>
          <div className="auth-highlights">
            <span>Temiz kayıt akışı</span>
            <span>Güvenli form kontrolü</span>
            <span>Türkçe yönetim paneli</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-header">
            <span className="eyebrow">Hesap oluştur</span>
            <h2>Kayıt Ol</h2>
            <p>Bilgilerinizi girerek devam edin.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Ad soyad</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Adınız Soyadınız"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? "input-error" : ""}
                autoComplete="name"
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">E-posta</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="ornek@mail.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
                autoComplete="email"
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="registerPassword">Şifre</label>
              <input
                id="registerPassword"
                type="password"
                name="password"
                placeholder="En az 6 karakter"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
                autoComplete="new-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Şifre onayı</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Şifrenizi tekrar girin"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            {message.text && (
              <div className={`message ${message.type}`} role="status">
                {message.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? "Kaydediliyor…" : "Kayıt Ol"}
            </button>
          </form>

          <div className="form-footer">
            <p>
              Zaten hesabınız var mı?{" "}
              <Link to="/" className="link">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;
