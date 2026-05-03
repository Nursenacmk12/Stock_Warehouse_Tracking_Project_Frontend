import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUsers, fetchRoles, changeUserRole, deleteUser } from "../../services/userApi.js";
import "./Users.css";

const roleBadgeClass = {
  SuperAdmin: "badge danger",
  Admin: "badge warning",
  WarehouseManager: "badge success",
  Manager: "badge neutral",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([fetchUsers(), fetchRoles()]);
    if (usersRes.ok) setUsers(usersRes.data);
    if (rolesRes.ok) setRoles(rolesRes.data);
    if (!usersRes.ok) setMessage({ type: "error", text: usersRes.message });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (userId, newRoleId) => {
    const result = await changeUserRole(userId, Number(newRoleId));
    if (result.ok) {
      setMessage({ type: "success", text: "Rol başarıyla güncellendi." });
      await loadData();
    } else {
      setMessage({ type: "error", text: result.message });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleDelete = async (userId) => {
    const result = await deleteUser(userId);
    if (result.ok) {
      setMessage({ type: "success", text: "Kullanıcı başarıyla silindi." });
      setConfirmDelete(null);
      await loadData();
    } else {
      setMessage({ type: "error", text: result.message });
    }
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Yönetim</span>
          <h1>Kullanıcı Yönetimi</h1>
          <p>Sistemdeki tüm kullanıcıları görüntüleyin, rol atayın veya yeni kullanıcı oluşturun.</p>
        </div>
        <Link to="/admin/users/new" className="btn btn-primary">
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Kullanıcı
        </Link>
      </div>

      {message.text && (
        <div className={`message ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Kullanıcılar</h2>
            <p>{users.length} kayıtlı kullanıcı</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Yükleniyor...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <strong>Kullanıcı bulunamadı</strong>
            <p>Henüz kayıtlı kullanıcı yok.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ad Soyad</th>
                  <th>E-posta</th>
                  <th>Rol</th>
                  <th>Kayıt Tarihi</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className={u.isDeleted ? "danger-row" : ""}>
                    <td className="numeric-cell">{u.userId}</td>
                    <td className="product-title">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="role-select"
                        value={u.roleId}
                        onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                        disabled={u.isDeleted}
                      >
                        {roles.map((r) => (
                          <option key={r.roleId} value={r.roleId}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("tr-TR")}</td>
                    <td>
                      <span className={u.isDeleted ? "badge danger" : "badge success"}>
                        {u.isDeleted ? "Pasif" : "Aktif"}
                      </span>
                    </td>
                    <td>
                      {confirmDelete === u.userId ? (
                        <div className="confirm-actions">
                          <button
                            className="btn-icon-only danger"
                            onClick={() => handleDelete(u.userId)}
                            title="Onayla"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button
                            className="btn-icon-only"
                            onClick={() => setConfirmDelete(null)}
                            title="İptal"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-icon-only danger"
                          onClick={() => setConfirmDelete(u.userId)}
                          disabled={u.isDeleted}
                          title="Sil"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
