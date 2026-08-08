import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  KpiCard,
  Pagination,
  StatusBadge,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { fetchMovements, movementTypeOptions } from "../services/movementApi.js";
import { downloadCsv } from "../utils/csv.js";
import "./Movements.css";

const movementEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M8 7h12m0 0l-4-4m4 4l-4 4M9 17H7a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
  </svg>
);

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

  const clearFilters = () => {
    setFilters({ type: "", dateFrom: "", dateTo: "", page: 1 });
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
    {
      key: "productCode",
      header: "Malzeme",
      render: (row) => (
        <div className="entity-name">
          <strong>{row.productCode || "—"}</strong>
          <span>{row.refNo || "Referans yok"}</span>
        </div>
      ),
    },
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
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">İşlem geçmişi</span>
          <h1>Stok Hareketleri</h1>
          <p>SAP stok giriş, çıkış ve depo transferlerini API’nin sayfalı hareket akışından takip edin.</p>
        </div>
        <Button variant="primary" onClick={exportRows} disabled={rows.length === 0}>
          CSV Dışa Aktar
        </Button>
      </div>

      <Toast message={message} />

      <div className="stats-grid">
        <KpiCard label="Giriş (sayfa)" value={summary.in} tone="green" />
        <KpiCard label="Çıkış (sayfa)" value={summary.out} tone="red" />
        <KpiCard label="Transfer (sayfa)" value={summary.transfer} tone="blue" />
        <KpiCard label="Toplam kayıt" value={meta.totalCount} tone="amber" />
      </div>

      <FilterBar
        secondary={
          <>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter("dateFrom", event.target.value)}
              aria-label="Başlangıç tarihi"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
              aria-label="Bitiş tarihi"
            />
          </>
        }
        actions={<Button onClick={loadData}>Yenile</Button>}
      >
        <select
          value={filters.type}
          onChange={(event) => updateFilter("type", event.target.value)}
          aria-label="İşlem tipi"
        >
          <option value="">Tüm işlemler</option>
          {movementTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Hareket listesi</h2>
            <p className="list-card-meta">
              <strong>{meta.totalCount}</strong> kayıt · sayfa {meta.page}/{meta.totalPages || 1}
            </p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          empty={
            <EmptyState
              icon={movementEmptyIcon}
              title="Hareket bulunamadı"
              text="Seçili filtrelerde stok hareketi yok."
              action={
                <>
                  <Button onClick={clearFilters}>Filtreleri temizle</Button>
                  <Link to="/operations" className="btn btn-secondary">
                    Operasyona git
                  </Link>
                </>
              }
            />
          }
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
