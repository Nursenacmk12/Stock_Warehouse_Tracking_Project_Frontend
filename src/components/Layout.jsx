import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { useTheme } from "../context/useTheme.js";
import "./Layout.css";

const menuItems = [
  { path: "/dashboard", label: "Gösterge Paneli", icon: "dashboard" },
  { path: "/products", label: "Ürünler", icon: "products", roles: ["SuperAdmin", "Admin", "WarehouseManager"] },
  { path: "/categories", label: "Kategoriler", icon: "categories", roles: ["SuperAdmin", "Admin", "WarehouseManager"] },
  { path: "/movements", label: "Stok Hareketleri", icon: "movements" },
  { path: "/settings", label: "Ayarlar", icon: "settings", roles: ["SuperAdmin", "Admin"] },
  { path: "/admin/users", label: "Kullanıcı Yönetimi", icon: "users", roles: ["SuperAdmin"] },
];

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  categories: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  movements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 7h12m0 0l-4-4m4 4l-4 4M9 17H7a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

function userInitials(displayName) {
  if (!displayName?.trim()) return "??";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return displayName.trim().slice(0, 2).toUpperCase();
}

function Layout({ children }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">ST</div>
          <div>
            <h1>Stok Takip</h1>
            <p>Yönetim paneli</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Ana menü">
          {menuItems
            .filter((item) => !item.roles || item.roles.includes(user?.role))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                title={item.label}
              >
                <span className="nav-icon">{icons[item.icon]}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme} type="button" title={theme === "dark" ? "Açık tema" : "Koyu tema"}>
            <span className="nav-icon">{theme === "dark" ? icons.sun : icons.moon}</span>
            <span className="nav-label">{theme === "dark" ? "Açık Tema" : "Koyu Tema"}</span>
          </button>
          <button className="logout-btn" onClick={handleLogout} type="button">
            <span className="nav-icon">{icons.logout}</span>
            <span className="nav-label">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">Bugünkü durum</span>
            <strong>Depo operasyonları hazır</strong>
          </div>
          <div className="topbar-actions">
            <span className="status-pill">Çevrimiçi</span>
            <div className="user-chip" aria-label="Aktif kullanıcı">
              <span>{userInitials(user?.userName)}</span>
              <div>
                <strong>{user?.userName ?? "Kullanıcı"}</strong>
                <small>{user?.role ?? "—"}</small>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
