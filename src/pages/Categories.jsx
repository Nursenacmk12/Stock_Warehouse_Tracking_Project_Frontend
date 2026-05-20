import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, DataTable, EmptyState, FilterBar, StatusBadge, Toast } from "../components/ui/CommonUI.jsx";
import { fetchProducts } from "../services/productApi.js";
import { fetchStocks } from "../services/stockApi.js";
import "./Categories.css";

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

      <FilterBar>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kategori ara" />
        <Button onClick={loadData}>Yenile</Button>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          rows={categoryStats}
          getRowKey={(category) => category.id}
          loading={loading}
          empty={<EmptyState title="Kategori bulunamadı" text="Ürünlerde kategori alanı bulunmuyor." />}
        />
      </div>
    </div>
  );
}

export default Categories;
