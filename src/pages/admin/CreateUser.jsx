import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUser } from "../../services/userApi.js";
import { fetchRoles } from "../../services/userApi.js";
import "../../App.css";

function CreateUser() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleId: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRoles().then((res) => {
      if (res.ok) {
        setRoles(res.data);
        if (res.data.length > 0 && !formData.roleId) {
          setFormData((prev) => ({ ...prev, roleId: String(res.data[0].roleId) }));
        }
      }
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Ad soyad zorunludur.";
    if (!formData.email.trim()) newErrors.email = "E-posta zorunludur.";
    if (!formData.password) newErrors.password = "Şifre zorunludur.";
    else if (formData.password.length < 6) newErrors.password = "Şifre en az 6 karakter olmalıdır.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Şifreler eşleşmiyor.";
    if (!formData.roleId) newErrors.roleId = "Rol seçiniz.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    const result = await createUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      roleId: Number(formData.roleId),
    });

    setSubmitting(false);

    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }

    setMessage({ type: "success", text: "Kullanıcı başarıyla oluşturuldu." });
    setTimeout(() => navigate("/admin/users"), 1200);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Yönetim</span>
          <h1>Yeni Kullanıcı Oluştur</h1>
          <p>Sisteme yeni bir kullanıcı ekleyin ve rol atayın.</p>
        </div>
        <Link to="/admin/users" className="btn btn-secondary">
          Geri Dön
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="card-header">
          <div>
            <h2>Kullanıcı Bilgileri</h2>
            <p>Tüm alanları doldurun.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div className="form-group">
            <label htmlFor="name">Ad Soyad</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Adı Soyadı"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
              autoComplete="name"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@mail.com"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Şifre</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="En az 6 karakter"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
                autoComplete="new-password"
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Şifre Onayı</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Şifreyi tekrar girin"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="roleId">Rol</label>
            <select
              id="roleId"
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className={errors.roleId ? "input-error" : ""}
            >
              <option value="">Rol seçiniz</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.roleId && <span className="field-error">{errors.roleId}</span>}
          </div>

          {message.text && (
            <div className={`message ${message.type}`} role="status">
              {message.text}
            </div>
          )}

          <div className="modal-footer">
            <Link to="/admin/users" className="btn btn-secondary">
              İptal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;
