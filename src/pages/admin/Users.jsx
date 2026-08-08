import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, EmptyState, FilterBar, LoadingState, Toast } from "../../components/ui/CommonUI.jsx";
import { fetchUsers, fetchRoles, changeUserRole, deleteUser } from "../../services/userApi.js";
import "./Users.css";

const userEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
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
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        String(u.userId).includes(term),
    );
  }, [query, users]);

  const handleRoleChange = async (userId, newRoleId) => {
    const result = await changeUserRole(userId, Number(newRoleId));
    if (result.ok) {
      setMessage({ type: "success", text: "Rol başarıyla güncellendi." });
      await loadData();
    } else {
      setMessage({ type: "error", text: result.message });
    }
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

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <FilterBar actions={<Button onClick={loadData}>Yenile</Button>}>
        <input
          className="filter-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad, e-posta veya ID ara"
          aria-label="Kullanıcı ara"
        />
      </FilterBar>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Kullanıcılar</h2>
            <p className="list-card-meta">
              <strong>{filteredUsers.length}</strong> kullanıcı gösteriliyor
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingState text="Kullanıcılar yükleniyor..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={userEmptyIcon}
            title="Kullanıcı bulunamadı"
            text={users.length === 0 ? "Henüz kayıtlı kullanıcı yok." : "Arama sonucu eşleşmedi."}
            action={
              <Link to="/admin/users/new" className="btn btn-primary">
                Yeni Kullanıcı
              </Link>
            }
          />
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
                {filteredUsers.map((u) => (
                  <tr key={u.userId} className={u.isDeleted ? "danger-row" : ""}>
                    <td className="numeric-cell">{u.userId}</td>
                    <td>
                      <div className="entity-name">
                        <strong>{u.name}</strong>
                        <span>#{u.userId}</span>
                      </div>
                    </td>
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
                            type="button"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button
                            className="btn-icon-only"
                            onClick={() => setConfirmDelete(null)}
                            title="İptal"
                            type="button"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-icon-only danger"
                          onClick={() => setConfirmDelete(u.userId)}
                          disabled={u.isDeleted}
                          title="Sil"
                          type="button"
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
