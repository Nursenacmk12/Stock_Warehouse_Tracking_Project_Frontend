import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/useAuth.js";
import { useTheme } from "../context/useTheme.js";
import { fetchLowStockCount } from "../services/alertApi.js";
import { subscribeSapFallback } from "../services/sapFallback.js";
import CommandPalette from "./CommandPalette.jsx";
import "./Layout.css";

const pageMeta = {
  "/dashboard": { section: "Genel", title: "Gösterge Paneli" },
  "/analytics": { section: "Genel", title: "Analitik" },
  "/products": { section: "Envanter", title: "Ürünler" },
  "/warehouses": { section: "Envanter", title: "Depolar" },
  "/stocks": { section: "Envanter", title: "Stoklar" },
  "/categories": { section: "Envanter", title: "Kategoriler" },
  "/operations": { section: "Operasyon", title: "Operasyon" },
  "/movements": { section: "Operasyon", title: "Stok Hareketleri" },
  "/alerts": { section: "Operasyon", title: "Uyarılar" },
  "/reports": { section: "İçgörü", title: "Raporlar" },
  "/integrations": { section: "Sistem", title: "Entegrasyonlar" },
  "/logs": { section: "Sistem", title: "Event Log" },
  "/settings": { section: "Sistem", title: "Ayarlar" },
  "/admin/users": { section: "Sistem", title: "Kullanıcı Yönetimi" },
};

const alertRoles = ["SuperAdmin", "Admin", "WarehouseManager"];

const SIDEBAR_COLLAPSED_KEY = "stockguard-sidebar-collapsed";
const SIDEBAR_EXPANDED_SECTIONS_KEY = "stockguard-sidebar-expanded-sections";

const navGroups = [
  {
    id: "genel",
    label: "Genel",
    items: [
      { path: "/dashboard", label: "Gösterge Paneli", icon: "dashboard" },
      { path: "/analytics", label: "Analitik", icon: "analytics", roles: ["SuperAdmin", "Admin", "Manager"] },
    ],
  },
  {
    id: "envanter",
    label: "Envanter",
    items: [
      { path: "/products", label: "Ürünler", icon: "products", roles: ["SuperAdmin", "Admin", "WarehouseManager"] },
      { path: "/warehouses", label: "Depolar", icon: "warehouses", roles: ["SuperAdmin", "Admin", "WarehouseManager"] },
      { path: "/stocks", label: "Stoklar", icon: "stocks" },
      { path: "/categories", label: "Kategoriler", icon: "categories", roles: ["SuperAdmin", "Admin", "WarehouseManager"] },
    ],
  },
  {
    id: "operasyon",
    label: "Operasyon",
    items: [
      { path: "/operations", label: "Operasyon", icon: "operations", roles: ["SuperAdmin", "Admin", "WarehouseManager"] },
      { path: "/movements", label: "Stok Hareketleri", icon: "movements" },
      { path: "/alerts", label: "Uyarılar", icon: "alerts", roles: ["SuperAdmin", "Admin", "WarehouseManager"], badge: true },
    ],
  },
  {
    id: "icgoru",
    label: "İçgörü",
    items: [
      // Manager ≠ Reports (analytics-only for Manager)
      { path: "/reports", label: "Raporlar", icon: "reports", roles: ["SuperAdmin", "Admin"] },
    ],
  },
];

const systemGroup = {
  id: "sistem",
  label: "Sistem",
  items: [
    { path: "/integrations", label: "Entegrasyonlar", icon: "integrations", roles: ["SuperAdmin", "Admin"] },
    { path: "/logs", label: "Event Log", icon: "logs", roles: ["SuperAdmin", "Admin"] },
    { path: "/settings", label: "Ayarlar", icon: "settings", roles: ["SuperAdmin", "Admin"] },
    { path: "/admin/users", label: "Kullanıcı Yönetimi", icon: "users", roles: ["SuperAdmin"] },
  ],
};

const allNavGroups = [...navGroups, systemGroup];

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
  warehouses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-7h6v7" />
      <path d="M7 10h10" />
    </svg>
  ),
  stocks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  operations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="4" />
      <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  ),
  movements: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 7h12m0 0l-4-4m4 4l-4 4M9 17H7a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
    </svg>
  ),
  alerts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16V10" />
      <path d="M12 16V7" />
      <path d="M16 16v-4" />
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  ),
  integrations: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
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
  collapse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
    </svg>
  ),
  expand: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
};

function resolvePageMeta(pathname) {
  if (pageMeta[pathname]) return pageMeta[pathname];
  const match = Object.keys(pageMeta).find((path) => pathname.startsWith(`${path}/`));
  return match ? pageMeta[match] : { section: "Panel", title: "StockGuard" };
}

function userInitials(displayName) {
  if (!displayName?.trim()) return "??";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return displayName.trim().slice(0, 2).toUpperCase();
}

function filterVisibleItems(items, role) {
  return items.filter((item) => !item.roles || item.roles.includes(role));
}

function groupContainsPath(group, pathname) {
  return group.items.some(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
}

function readExpandedSections() {
  try {
    const raw = localStorage.getItem(SIDEBAR_EXPANDED_SECTIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : null;
  } catch {
    return null;
  }
}

function writeExpandedSections(ids) {
  try {
    localStorage.setItem(SIDEBAR_EXPANDED_SECTIONS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function defaultExpandedIds(pathname) {
  const active = allNavGroups.filter((group) => groupContainsPath(group, pathname)).map((g) => g.id);
  const ids = new Set(active.length ? active : ["genel"]);
  // Keep system links reachable; collapsed accordion + overflow was blocking the last item.
  ids.add("sistem");
  return ids;
}

function NavItem({ item, alertCount, collapsed }) {
  const showBadge = item.badge && alertCount > 0;

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
      title={item.label}
    >
      <span className="nav-icon">{icons[item.icon]}</span>
      {!collapsed && <span className="nav-label">{item.label}</span>}
      {showBadge && (
        <span className="nav-badge" aria-label={`${alertCount} uyarı`}>
          {alertCount > 99 ? "99+" : alertCount}
        </span>
      )}
    </NavLink>
  );
}

function NavGroup({ group, role, alertCount, collapsed, expanded, onToggle }) {
  const visible = filterVisibleItems(group.items, role);
  if (visible.length === 0) return null;

  const panelId = `nav-group-panel-${group.id}`;
  const labelId = `nav-group-${group.id}`;
  const isOpen = collapsed || expanded;

  return (
    <div className={`nav-group ${isOpen ? "is-open" : "is-collapsed"}`}>
      {!collapsed && (
        <button
          type="button"
          className="nav-group-toggle"
          id={labelId}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => onToggle(group.id)}
        >
          <span className="nav-group-label-text">{group.label}</span>
          <span className={`nav-group-chevron ${expanded ? "open" : ""}`} aria-hidden="true">
            {icons.chevron}
          </span>
        </button>
      )}
      <div
        id={panelId}
        className={`nav-group-panel ${isOpen ? "open" : ""}`}
        role="group"
        aria-labelledby={collapsed ? undefined : labelId}
        aria-label={collapsed ? group.label : undefined}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <div className="nav-group-items">
          {visible.map((item) => (
            <NavItem key={item.path} item={item} alertCount={alertCount} collapsed={collapsed} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, preference, cyclePreference } = useTheme();
  const [alertCount, setAlertCount] = useState(0);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const next = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (next === null) {
        const legacy = localStorage.getItem("stok-takip-sidebar-collapsed");
        return legacy === "1";
      }
      return next === "1";
    } catch {
      return false;
    }
  });
  const [expandedSections, setExpandedSections] = useState(() => {
    const stored = readExpandedSections();
    const base = stored ? new Set(stored) : defaultExpandedIds(window.location.pathname);
    base.add("sistem");
    allNavGroups.forEach((group) => {
      if (groupContainsPath(group, window.location.pathname)) base.add(group.id);
    });
    return base;
  });
  const [mockMode, setMockMode] = useState(() => ({ active: false, reason: "", source: "live" }));

  const themeLabel =
    preference === "system" ? "Sistem Teması" : preference === "dark" ? "Koyu Tema" : "Açık Tema";
  const themeTitle =
    preference === "system"
      ? "Sistem (sonraki: Açık)"
      : preference === "light"
        ? "Açık (sonraki: Koyu)"
        : "Koyu (sonraki: Sistem)";

  const currentPage = useMemo(() => resolvePageMeta(location.pathname), [location.pathname]);
  const canSeeAlerts = alertRoles.includes(user?.role);
  const role = user?.role;

  const commandItems = useMemo(() => {
    const groups = [...navGroups, systemGroup];
    return groups.flatMap((group) =>
      filterVisibleItems(group.items, role).map((item) => ({
        path: item.path,
        label: item.label,
        group: group.label,
      })),
    );
  }, [role]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => subscribeSapFallback(setMockMode), []);

  useEffect(() => {
    let alive = true;
    fetchLowStockCount()
      .then((count) => {
        if (alive) setAlertCount(count);
      })
      .catch(() => {
        if (alive) setAlertCount(0);
      });
    const timer = window.setInterval(() => {
      fetchLowStockCount()
        .then((count) => {
          if (alive) setAlertCount(count);
        })
        .catch(() => {});
    }, 60000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      let changed = false;
      allNavGroups.forEach((group) => {
        if (groupContainsPath(group, location.pathname) && !next.has(group.id)) {
          next.add(group.id);
          changed = true;
        }
      });
      if (changed) writeExpandedSections(next);
      return changed ? next : prev;
    });
  }, [location.pathname]);

  const toggleSection = (groupId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        const activeGroup = allNavGroups.find((group) => groupContainsPath(group, location.pathname));
        if (activeGroup?.id === groupId) {
          return prev;
        }
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      writeExpandedSections(next);
      return next;
    });
  };

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className={`layout ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar" aria-label="Kenar çubuğu">
        <div className="sidebar-header">
          <div className="sidebar-brand-row">
            {collapsed ? (
              <div className="sidebar-logo" aria-hidden="true">
                <img src="/stockguard-icon.png" alt="" className="sidebar-logo-img" />
              </div>
            ) : (
              <div className="sidebar-brand">
                <img src="/stockguard-logo.png" alt="Cyber Guard" className="sidebar-brand-logo" />
                <p className="sidebar-tagline">Stok & Depo Yönetimi</p>
              </div>
            )}
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={toggleCollapsed}
              title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
              aria-pressed={collapsed}
            >
              <span className="nav-icon">{collapsed ? icons.expand : icons.collapse}</span>
            </button>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Ana menü">
          <div className="sidebar-nav-main">
            {navGroups.map((group) => (
              <NavGroup
                key={group.id}
                group={group}
                role={role}
                alertCount={alertCount}
                collapsed={collapsed}
                expanded={expandedSections.has(group.id)}
                onToggle={toggleSection}
              />
            ))}
          </div>

          <div className="sidebar-nav-system">
            <NavGroup
              group={systemGroup}
              role={role}
              alertCount={alertCount}
              collapsed={collapsed}
              expanded={expandedSections.has(systemGroup.id)}
              onToggle={toggleSection}
            />
          </div>
        </nav>

        <div className="sidebar-footer">
          <button
            className="theme-toggle-btn"
            onClick={cyclePreference}
            type="button"
            title={themeTitle}
          >
            <span className="nav-icon">{theme === "dark" ? icons.sun : icons.moon}</span>
            {!collapsed && <span className="nav-label">{themeLabel}</span>}
          </button>
          <button className="logout-btn" onClick={handleLogout} type="button" title="Çıkış Yap">
            <span className="nav-icon">{icons.logout}</span>
            {!collapsed && <span className="nav-label">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      <div className="workspace">
        {mockMode.active && (
          <div className="mock-data-banner" role="status">
            <span className="mock-data-dot" aria-hidden="true" />
            <span>
              {mockMode.source === "mock" ? (
                <>
                  Canlı SAP yerine <strong>örnek (mock) veri</strong> gösteriliyor
                  {mockMode.reason ? (
                    <>
                      {" "}
                      — neden: <code>{mockMode.reason}</code>
                    </>
                  ) : null}
                  . Karar için canlı kaynağı doğrulayın.
                </>
              ) : (
                <>
                  SAP verisi alınamadı
                  {mockMode.reason ? ` (${mockMode.reason})` : ""}.
                </>
              )}
            </span>
          </div>
        )}
        <header className="topbar">
          <nav className="topbar-context" aria-label="Sayfa konumu">
            <span className="topbar-kicker">{currentPage.section}</span>
            <strong>{currentPage.title}</strong>
          </nav>
          <div className="topbar-actions">
            <button
              type="button"
              className="topbar-cmdk"
              onClick={() => setCmdOpen(true)}
              title="Hızlı gezinme (Ctrl/⌘ K)"
            >
              <span>Gezin</span>
              <kbd>Ctrl K</kbd>
            </button>
            {canSeeAlerts && (
              <NavLink
                to="/alerts"
                className={`topbar-alerts${alertCount > 0 ? " has-alerts" : ""}`}
                title={alertCount > 0 ? `${alertCount} kritik stok uyarısı` : "Uyarılar"}
              >
                <span className="topbar-alerts-icon" aria-hidden="true">
                  {icons.bell}
                </span>
                <span className="topbar-alerts-label">Uyarılar</span>
                {alertCount > 0 && (
                  <span className="topbar-alerts-count" aria-label={`${alertCount} uyarı`}>
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </NavLink>
            )}
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

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        items={commandItems}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
}

export default Layout;
