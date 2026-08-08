import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, DataTable, EmptyState, FilterBar, StatusBadge, Toast } from "../components/ui/CommonUI.jsx";
import { fetchProducts } from "../services/productApi.js";
import { fetchStocks } from "../services/stockApi.js";
import "./Categories.css";

const categoryEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

function Categories() {
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextProducts, nextStocks] = await Promise.all([fetchProducts(), fetchStocks()]);
      setProducts(nextProducts);
      setStocks(nextStocks);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
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

  const stockByMaterial = useMemo(() => {
    return stocks.reduce((acc, stock) => {
      acc[stock.materialNo] = (acc[stock.materialNo] ?? 0) + stock.quantity;
      return acc;
    }, {});
  }, [stocks]);

  const categoryStats = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const name = product.category || "Genel";
      if (!acc[name]) {
        acc[name] = { id: name, name, productCount: 0, totalStock: 0, sapOnlyCount: 0, emptyCount: 0 };
      }
      const totalStock = stockByMaterial[product.code] ?? 0;
      acc[name].productCount += 1;
      acc[name].totalStock += totalStock;
      if (product.isSapOnly) acc[name].sapOnlyCount += 1;
      if (totalStock <= 0) acc[name].emptyCount += 1;
      return acc;
    }, {});

    const term = query.trim().toLowerCase();
    return Object.values(grouped)
      .filter((category) => !term || category.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [products, query, stockByMaterial]);

  const columns = [
    {
      key: "name",
      header: "Kategori",
      render: (category) => (
        <div className="entity-name">
          <strong>{category.name}</strong>
          <span>{category.productCount} ürün</span>
        </div>
      ),
    },
    { key: "productCount", header: "Ürün", className: "numeric-cell" },
    { key: "totalStock", header: "Toplam Stok", className: "numeric-cell" },
    { key: "sapOnlyCount", header: "SAP Katalog", className: "numeric-cell" },
    {
      key: "status",
      header: "Durum",
      render: (category) => (
        <StatusBadge tone={category.emptyCount > 0 ? "warning" : "success"}>
          {category.emptyCount > 0 ? `${category.emptyCount} stoksuz` : "Stoklu"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Ürünlerden türetilen kategori analizi</span>
          <h1>Kategoriler</h1>
          <p>API’de ayrı kategori controller’ı olmadığı için kategori görünümü ürün katalog verisinden hesaplanır.</p>
        </div>
      </div>

      <Toast message={message} />

      <FilterBar actions={<Button onClick={loadData}>Yenile</Button>}>
        <input
          className="filter-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Kategori ara"
          aria-label="Kategori ara"
        />
      </FilterBar>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Kategori özeti</h2>
            <p className="list-card-meta">
              <strong>{categoryStats.length}</strong> kategori gösteriliyor
            </p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={categoryStats}
          getRowKey={(category) => category.id}
          loading={loading}
          empty={
            <EmptyState
              icon={categoryEmptyIcon}
              title="Kategori bulunamadı"
              text="Ürünlerde kategori alanı bulunmuyor."
              action={
                <Link to="/products" className="btn btn-secondary">
                  Ürünlere git
                </Link>
              }
            />
          }
        />
      </div>
    </div>
  );
}

export default Categories;
