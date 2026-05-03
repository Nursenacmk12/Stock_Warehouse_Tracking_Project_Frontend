import { useMemo } from "react";
import {
  getCategories,
  getLowStockProducts,
  getProducts,
  getTodayAddedCount,
  getTotalStock,
} from "../data/mockData";
import "./Dashboard.css";

const icons = {
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v3.5" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7h.01" />
      <path d="M3 11.5V7a4 4 0 0 1 4-4h4.5L21 12.5 12.5 21 3 11.5Z" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h8l-1 8 11-13h-8l0-7Z" />
    </svg>
  ),
};

function Dashboard() {
  const summary = useMemo(() => {
    const products = getProducts();
    const categories = getCategories();
    const lowStock = getLowStockProducts();
    const totalStock = getTotalStock();
    const healthyStock = products.length - lowStock.length;

    return {
      products,
      categories,
      lowStock,
      totalStock,
      healthyStock,
      todayAdded: getTodayAddedCount(),
    };
  }, []);

  const recentProducts = useMemo(() => getProducts().slice(0, 6), []);
  const lowStockProducts = useMemo(() => getLowStockProducts().slice(0, 6), []);
  const criticalRate = summary.products.length
    ? Math.round((summary.lowStock.length / summary.products.length) * 100)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Genel bakış</span>
          <h1>Gösterge Paneli</h1>
          <p>Stok durumunu, kritik ürünleri ve güncel operasyon akışını tek ekranda takip edin.</p>
        </div>
      </div>

      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">Stok sağlığı</span>
          <h2>{summary.healthyStock} ürün normal seviyede</h2>
          <p>
            Kritik stok oranı %{criticalRate}. Öncelikli aksiyon gereken ürünler sağ panelde
            listelenir.
          </p>
        </div>
        <div className="hero-meter" aria-label={`Kritik stok oranı yüzde ${criticalRate}`}>
          <span style={{ width: `${Math.min(criticalRate, 100)}%` }} />
        </div>
      </section>

      <section className="stats-grid" aria-label="Stok özeti">
        <article className="kpi-card">
          <div className="kpi-icon blue">{icons.box}</div>
          <div>
            <span className="kpi-value">{summary.products.length}</span>
            <span className="kpi-label">Toplam Ürün</span>
          </div>
        </article>

        <article className="kpi-card critical">
          <div className="kpi-icon red">{icons.alert}</div>
          <div>
            <span className="kpi-value">{summary.lowStock.length}</span>
            <span className="kpi-label">Kritik Stok</span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-icon green">{icons.tag}</div>
          <div>
            <span className="kpi-value">{summary.categories.length}</span>
            <span className="kpi-label">Kategori</span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-icon amber">{icons.layers}</div>
          <div>
            <span className="kpi-value">{summary.totalStock}</span>
            <span className="kpi-label">Toplam Stok</span>
          </div>
        </article>

        <article className="kpi-card">
          <div className="kpi-icon teal">{icons.spark}</div>
          <div>
            <span className="kpi-value">{summary.todayAdded}</span>
            <span className="kpi-label">Bugün Eklenen</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="card">
          <div className="card-header">
            <div>
              <h2>Son Ürünler</h2>
              <p>En yeni ürün kayıtları ve stok durumları</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => {
                  const isCritical = product.stock < product.minStock;

                  return (
                    <tr key={product.id} className={isCritical ? "danger-row" : ""}>
                      <td className="product-title">{product.name}</td>
                      <td>{product.category}</td>
                      <td className="numeric-cell">{product.stock}</td>
                      <td>
                        <span className={`badge ${isCritical ? "danger" : "success"}`}>
                          {isCritical ? "Kritik" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <h2>Kritik Stokta Olanlar</h2>
              <p>Minimum seviyenin altındaki ürünler</p>
            </div>
            <span className="badge danger">{summary.lowStock.length} ürün</span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="empty-state">
              {icons.alert}
              <div>
                <strong>Kritik stok bulunmuyor</strong>
                <p>Tüm ürünler minimum stok seviyesinin üzerinde.</p>
              </div>
            </div>
          ) : (
            <div className="critical-list">
              {lowStockProducts.map((product) => {
                const percent = Math.min(
                  100,
                  Math.round((product.stock / Math.max(product.minStock, 1)) * 100),
                );

                return (
                  <div className="critical-item" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                    </div>
                    <div className="critical-meta">
                      <span>
                        {product.stock} / {product.minStock}
                      </span>
                      <div className="stock-bar">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
