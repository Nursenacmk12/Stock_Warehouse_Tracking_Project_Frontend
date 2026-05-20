import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, DataTable, EmptyState, KpiCard, StatusBadge, Toast } from "../components/ui/CommonUI.jsx";
import { fetchMovements } from "../services/movementApi.js";
import { fetchProducts } from "../services/productApi.js";
import { fetchHealth } from "../services/systemApi.js";
import { fetchStocks } from "../services/stockApi.js";
import { fetchWarehouses } from "../services/warehouseApi.js";
import "./Dashboard.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("tr-TR");
}

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sapStatus, setSapStatus] = useState("checking");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setSapStatus("checking");
    try {
      const [nextProducts, nextStocks, nextWarehouses, nextMovements, sapHealth] = await Promise.all([
        fetchProducts(),
        fetchStocks(),
        fetchWarehouses(),
        fetchMovements({ page: 1, pageSize: 8 }),
        fetchHealth("/health/sap"),
      ]);
      setProducts(nextProducts);
      setStocks(nextStocks);
      setWarehouses(nextWarehouses);
      setMovements(nextMovements.items);
      setSapStatus(sapHealth.ok ? "healthy" : "unhealthy");
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setSapStatus("unhealthy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const productByCode = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.code] = product;
      return acc;
    }, {});
  }, [products]);

  const stockByMaterial = useMemo(() => {
    return stocks.reduce((acc, stock) => {
      acc[stock.materialNo] = (acc[stock.materialNo] ?? 0) + stock.quantity;
      return acc;
    }, {});
  }, [stocks]);

  const warehouseTotals = useMemo(() => {
    const grouped = stocks.reduce((acc, stock) => {
      acc[stock.warehouseId] = (acc[stock.warehouseId] ?? 0) + stock.quantity;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([code, quantity]) => ({
        code,
        name: warehouses.find((warehouse) => warehouse.code === code)?.name ?? code,
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);
  }, [stocks, warehouses]);

  const categoryTotals = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const category = product.category || "Genel";
      acc[category] = (acc[category] ?? 0) + (stockByMaterial[product.code] ?? 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [products, stockByMaterial]);

  const summary = useMemo(() => {
    const totalStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const emptyMaterials = stocks.filter((stock) => stock.quantity <= 0).length;
    const sapOnly = products.filter((product) => product.isSapOnly).length;

    return {
      totalStock,
      emptyMaterials,
      sapOnly,
      products: products.length,
      warehouses: warehouses.length,
      movements: movements.length,
    };
  }, [movements.length, products, stocks, warehouses.length]);

  const maxWarehouseQuantity = Math.max(1, ...warehouseTotals.map((item) => item.quantity));
  const maxCategoryQuantity = Math.max(1, ...categoryTotals.map((item) => item.quantity));

  const movementColumns = [
    { key: "date", header: "Tarih", render: (row) => formatDate(row.date) },
    { key: "type", header: "İşlem", render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge> },
    {
      key: "productCode",
      header: "Malzeme",
      render: (row) => productByCode[row.productCode]?.name ?? row.productCode,
    },
    { key: "quantity", header: "Miktar", className: "numeric-cell" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Genel bakış</span>
          <h1>Gösterge Paneli</h1>
          <p>SAP stok sağlığı, operasyon hacmi ve depo dağılımını canlı API verileriyle izleyin.</p>
        </div>
        <Button onClick={loadData}>Yenile</Button>
      </div>

      <Toast message={message} />

      <section className="sap-status-bar" aria-label="SAP bağlantı durumu">
        <div className={`sap-indicator ${sapStatus}`}>
          <span className="sap-dot" />
          <strong>SAP Bağlantısı</strong>
          <span>
            {sapStatus === "checking" ? "Kontrol ediliyor..." : sapStatus === "healthy" ? "Aktif" : "Bağlantı kesik"}
          </span>
        </div>
      </section>

      <section className="stats-grid" aria-label="Operasyon özeti">
        <KpiCard label="Toplam Ürün" value={summary.products} tone="blue" helper={`${summary.sapOnly} SAP katalog`} />
        <KpiCard label="Toplam Stok" value={summary.totalStock} tone="green" />
        <KpiCard label="Depo" value={summary.warehouses} tone="amber" />
        <KpiCard label="Stoksuz Satır" value={summary.emptyMaterials} tone="red" />
        <KpiCard label="Son Hareket" value={summary.movements} tone="teal" />
      </section>

      <section className="dashboard-grid">
        <article className="card chart-card">
          <div className="card-header">
            <div>
              <h2>Depo Bazlı Stok</h2>
              <p>En yüksek miktara sahip depo stokları</p>
            </div>
          </div>
          <div className="bar-list">
            {warehouseTotals.length === 0 ? (
              <EmptyState title="Depo stoku yok" text="SAP stok servisi depo dağılımı döndürmedi." />
            ) : (
              warehouseTotals.map((item) => (
                <div className="bar-row" key={item.code}>
                  <header>
                    <strong>{item.name}</strong>
                    <span>{item.quantity}</span>
                  </header>
                  <div className="bar-track">
                    <span style={{ width: `${Math.round((item.quantity / maxWarehouseQuantity) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card chart-card">
          <div className="card-header">
            <div>
              <h2>Kategori Stok Dağılımı</h2>
              <p>Ürün kategorilerine göre toplam stok</p>
            </div>
          </div>
          <div className="bar-list">
            {categoryTotals.length === 0 ? (
              <EmptyState title="Kategori verisi yok" text="Ürün kataloğunda kategori alanı bulunmuyor." />
            ) : (
              categoryTotals.map((item) => (
                <div className="bar-row" key={item.name}>
                  <header>
                    <strong>{item.name}</strong>
                    <span>{item.quantity}</span>
                  </header>
                  <div className="bar-track">
                    <span style={{ width: `${Math.round((item.quantity / maxCategoryQuantity) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Son Stok Hareketleri</h2>
            <p>API’den gelen en güncel operasyon kayıtları</p>
          </div>
        </div>
        <DataTable
          columns={movementColumns}
          rows={movements}
          getRowKey={(row) => row.id}
          loading={loading}
          empty={<EmptyState title="Hareket yok" text="Henüz stok hareketi kaydı bulunmuyor." />}
        />
      </section>
    </div>
  );
}

export default Dashboard;
