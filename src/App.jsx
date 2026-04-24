import { useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

function App() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.email || !formData.password) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    if (formData.email === "admin@gmail.com" && formData.password === "123456") {
      setSuccess("Giriş başarılı.");
    } else {
      setError("E-posta veya şifre hatalı.");
    }
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
          <h2>Giriş Yap</h2>
          <p className="login-text">Devam etmek için hesabınıza giriş yapın</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                name="email"
                placeholder="ornek@mail.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                name="password"
                placeholder="Şifrenizi girin"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            <button type="submit" className="login-btn">
              Giriş Yap
            </button>
          </form>

          <div className="form-footer">
            <p>
              Hesabınız yok mu?{" "}
              <Link to="/register" className="link">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;