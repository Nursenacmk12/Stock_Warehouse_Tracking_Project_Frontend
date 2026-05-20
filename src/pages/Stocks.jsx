import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  KpiCard,
  StatusBadge,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { fetchProducts } from "../services/productApi.js";
import { fetchStocks } from "../services/stockApi.js";
import { fetchWarehouses } from "../services/warehouseApi.js";
import { downloadCsv } from "../utils/csv.js";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("tr-TR").format(date);
}

function Stocks() {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [query, setQuery] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [status, setStatus] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextStocks, nextProducts, nextWarehouses] = await Promise.all([
        fetchStocks({ warehouseId: warehouse }),
        fetchProducts(),
        fetchWarehouses(),
      ]);
      setStocks(nextStocks);
      setProducts(nextProducts);
      setWarehouses(nextWarehouses);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, [warehouse]);

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

  const warehouseByCode = useMemo(() => {
    return warehouses.reduce((acc, item) => {
      acc[item.code] = item;
      return acc;
    }, {});
  }, [warehouses]);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return stocks.filter((stock) => {
      const product = productByCode[stock.materialNo];
      const wh = warehouseByCode[stock.warehouseId];
      const matchesQuery =
        !term ||
        stock.materialNo.toLowerCase().includes(term) ||
        product?.name.toLowerCase().includes(term) ||
        wh?.name.toLowerCase().includes(term);
      const matchesStatus =
        !status ||
        (status === "available" && stock.quantity > 0) ||
        (status === "empty" && stock.quantity <= 0);
      return matchesQuery && matchesStatus;
    });
  }, [productByCode, query, status, stocks, warehouseByCode]);

  const totals = useMemo(() => {
    const totalQuantity = rows.reduce((sum, stock) => sum + stock.quantity, 0);
    return {
      materialCount: new Set(rows.map((stock) => stock.materialNo)).size,
      warehouseCount: new Set(rows.map((stock) => stock.warehouseId)).size,
      totalQuantity,
      emptyCount: rows.filter((stock) => stock.quantity <= 0).length,
    };
  }, [rows]);

  const exportRows = () => {
    downloadCsv(
      "stok-listesi.csv",
      [
        { label: "Malzeme Kodu", value: (row) => row.materialNo },
        { label: "Ürün", value: (row) => productByCode[row.materialNo]?.name ?? "" },
        { label: "Depo", value: (row) => row.warehouseId },
        { label: "Miktar", value: (row) => row.quantity },
        { label: "Güncelleme", value: (row) => row.updatedAt ?? "" },
      ],
      rows,
    );
  };

  const columns = [
    {
      key: "materialNo",
      header: "Malzeme",
      render: (stock) => (
        <div className="entity-name">
          <strong>{productByCode[stock.materialNo]?.name ?? "SAP Malzeme"}</strong>
          <span>{stock.materialNo}</span>
        </div>
      ),
    },
    {
      key: "warehouseId",
      header: "Depo",
      render: (stock) => warehouseByCode[stock.warehouseId]?.name ?? stock.warehouseId,
    },
    { key: "quantity", header: "Miktar", className: "numeric-cell" },
    {
      key: "status",
      header: "Durum",
      render: (stock) => (
        <StatusBadge tone={stock.quantity > 0 ? "success" : "danger"}>
          {stock.quantity > 0 ? "Stok var" : "Stok yok"}
        </StatusBadge>
      ),
    },
    { key: "updatedAt", header: "Son Güncelleme", render: (stock) => formatDate(stock.updatedAt) },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">SAP stok görünümü</span>
          <h1>Stoklar</h1>
          <p>Malzeme ve depo bazlı SAP stok miktarlarını canlı API verisiyle izleyin.</p>
        </div>
        <Button variant="primary" onClick={exportRows} disabled={rows.length === 0}>CSV Dışa Aktar</Button>
      </div>

      <Toast message={message} />

      <div className="stats-grid">
        <KpiCard label="Malzeme" value={totals.materialCount} tone="blue" />
        <KpiCard label="Aktif Depo" value={totals.warehouseCount} tone="green" />
        <KpiCard label="Toplam Miktar" value={totals.totalQuantity} tone="amber" />
        <KpiCard label="Stok Yok" value={totals.emptyCount} tone="red" />
      </div>

      <FilterBar>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Malzeme, ürün veya depo ara" />
        <select value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>
          <option value="">Tüm depolar</option>
          {warehouses.map((item) => (
            <option key={item.code} value={item.code}>
              {item.code} - {item.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tüm durumlar</option>
          <option value="available">Stok var</option>
          <option value="empty">Stok yok</option>
        </select>
        <Button onClick={loadData}>Yenile</Button>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(stock) => stock.id}
          loading={loading}
          empty={<EmptyState title="Stok bulunamadı" text="SAP stok servisi sonuç döndürmedi." />}
        />
      </div>
    </div>
  );
}

export default Stocks;
