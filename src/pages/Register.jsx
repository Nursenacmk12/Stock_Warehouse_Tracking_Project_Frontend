import { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Ad Soyad alanı zorunludur.";
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

    // TODO: Replace with actual API call when backend is ready
    // Example:
    // const response = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     fullName: formData.fullName,
    //     email: formData.email,
    //     password: formData.password,
    //   }),
    // });
    // if (response.ok) {
    //   setSuccess("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
    // } else {
    //   setError("Kayıt işlemi başarısız oldu.");
    // }

    // Simulated registration success for frontend demo
    setSuccess("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-left">
          <h1>Stok Takip Sistemi</h1>
          <p>
            Ürün, depo ve stok yönetimini tek ekrandan kontrol et.
          </p>
        </div>

        <div className="login-right">
          <h2>Kayıt Ol</h2>
          <p className="login-text">Hesap oluşturarak devam edin</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                placeholder="Adınız Soyadınız"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? "input-error" : ""}
              />
              {errors.fullName && <span className="field-error">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                name="email"
                placeholder="ornek@mail.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                name="password"
                placeholder="En az 6 karakter"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Şifre Onayı</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Şifrenizi tekrar girin"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>

            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            <button type="submit" className="login-btn">
              Kayıt Ol
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
      </div>
    </div>
  );
}

export default Register;