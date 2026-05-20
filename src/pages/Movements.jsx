import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  Pagination,
  StatusBadge,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { fetchMovements, movementTypeOptions } from "../services/movementApi.js";
import { downloadCsv } from "../utils/csv.js";
import "./Movements.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Movements() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({ type: "", dateFrom: "", dateTo: "", page: 1 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMovements({
        ...filters,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : "",
        dateTo: filters.dateTo ? new Date(filters.dateTo) : "",
        pageSize: 20,
      });
      setRows(data.items);
      setMeta({
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      });
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc[row.typeCode] = (acc[row.typeCode] ?? 0) + 1;
        return acc;
      },
      { in: 0, out: 0, transfer: 0 },
    );
  }, [rows]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const exportRows = () => {
    downloadCsv(
      "stok-hareketleri.csv",
      [
        { label: "Tarih", value: (row) => row.date ?? "" },
        { label: "İşlem", value: (row) => row.typeLabel },
        { label: "Malzeme", value: (row) => row.productCode },
        { label: "Miktar", value: (row) => row.quantity },
        { label: "Kaynak Depo", value: (row) => row.sourceWarehouseCode },
        { label: "Hedef Depo", value: (row) => row.destWarehouseCode },
        { label: "Kullanıcı", value: (row) => row.userName },
        { label: "Referans", value: (row) => row.refNo },
      ],
      rows,
    );
  };

  const columns = [
    { key: "date", header: "Tarih", className: "date-cell", render: (row) => formatDate(row.date) },
    {
      key: "type",
      header: "İşlem",
      render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge>,
    },
    { key: "productCode", header: "Malzeme" },
    { key: "quantity", header: "Miktar", className: "numeric-cell" },
    {
      key: "warehouse",
      header: "Depo Akışı",
      render: (row) =>
        row.typeCode === "transfer"
          ? `${row.sourceWarehouseCode || "-"} → ${row.destWarehouseCode || "-"}`
          : row.destWarehouseCode || row.sourceWarehouseCode || "-",
    },
    { key: "userName", header: "Kullanıcı", render: (row) => row.userName || "-" },
    { key: "refNo", header: "Referans", render: (row) => row.refNo || "-" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">İşlem geçmişi</span>
          <h1>Stok Hareketleri</h1>
          <p>SAP stok giriş, çıkış ve depo transferlerini API’nin sayfalı hareket akışından takip edin.</p>
        </div>
        <Button variant="primary" onClick={exportRows} disabled={rows.length === 0}>CSV Dışa Aktar</Button>
      </div>

      <Toast message={message} />

      <div className="mini-grid">
        <article className="panel-card">
          <span className="eyebrow">Giriş</span>
          <h2>{summary.in}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">Çıkış</span>
          <h2>{summary.out}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">Transfer</span>
          <h2>{summary.transfer}</h2>
        </article>
      </div>

      <FilterBar>
        <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
          <option value="">Tüm işlemler</option>
          {movementTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} />
        <input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} />
        <Button onClick={loadData}>Yenile</Button>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          empty={<EmptyState title="Hareket bulunamadı" text="Seçili filtrelerde stok hareketi yok." />}
        />
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalCount={meta.totalCount}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </div>
    </div>
  );
}

export default Movements;
