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
import EmailReportDialog from "../components/EmailReportDialog.jsx";
import { fetchMovements, movementTypeOptions } from "../services/movementApi.js";
import {
  downloadReportExport,
  fetchMovementTrend,
  fetchStockSummaryReport,
  fetchWarehouseComparison,
} from "../services/reportApi.js";
import { downloadCsv } from "../utils/csv.js";
import { downloadExcelFromRows } from "../utils/excel.js";
import { downloadPdfReport } from "../utils/pdf.js";
import "./Reports.css";

const reportEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M4 19V5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("tr-TR");
}

function Reports() {
  const [tab, setTab] = useState("movements");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", type: "", page: 1 });
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showEmail, setShowEmail] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stockSummary, nextTrend, comparison] = await Promise.all([
        fetchMovements({
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : "",
          dateTo: filters.dateTo ? new Date(filters.dateTo) : "",
          type: filters.type || undefined,
          page: filters.page,
          pageSize: 20,
        }),
        fetchStockSummaryReport(),
        fetchMovementTrend("daily", filters.dateFrom || undefined, filters.dateTo || undefined),
        fetchWarehouseComparison(),
      ]);
      setRows(data.items);
      setMeta({ page: data.page, pageSize: data.pageSize, totalPages: data.totalPages, totalCount: data.totalCount });
      setSummary(stockSummary);
      setTrend(Array.isArray(nextTrend) ? nextTrend.slice(-7) : []);
      setWarehouses(Array.isArray(comparison) ? comparison : []);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", type: "", page: 1 });
  };

  const tabSummary = useMemo(
    () => ({
      success: rows.filter((row) => row.typeCode === "in").length,
      failed: rows.filter((row) => row.typeCode === "out").length,
      transfer: rows.filter((row) => row.typeCode === "transfer").length,
    }),
    [rows],
  );

  const maxTrend = Math.max(
    1,
    ...trend.flatMap((point) => [Number(point.inCount ?? 0), Number(point.outCount ?? 0), Number(point.transferCount ?? 0)]),
  );

  const exportRows = () => {
    downloadCsv(
      "hareket-raporu.csv",
      [
        { label: "Tarih", value: (row) => row.date ?? "" },
        { label: "İşlem", value: (row) => row.typeLabel },
        { label: "Malzeme", value: (row) => row.productCode },
        { label: "Miktar", value: (row) => row.quantity },
        { label: "Kullanıcı", value: (row) => row.userName },
      ],
      rows,
    );
  };

  const exportExcel = () => {
    downloadExcelFromRows(
      "hareket-raporu.xlsx",
      [
        { label: "Tarih", value: (row) => row.date ?? "" },
        { label: "İşlem", value: (row) => row.typeLabel ?? "" },
        { label: "Malzeme", value: (row) => row.productCode ?? "" },
        { label: "Miktar", value: (row) => row.quantity ?? "" },
        { label: "Kullanıcı", value: (row) => row.userName ?? "" },
      ],
      rows,
    );
  };

  const exportPdf = () => {
    downloadPdfReport(
      "Hareket Raporu",
      [
        { label: "Tarih", value: (row) => formatDate(row.date) },
        { label: "İşlem", value: (row) => row.typeLabel ?? "" },
        { label: "Malzeme", value: (row) => row.productCode ?? "" },
        { label: "Miktar", value: (row) => String(row.quantity ?? "") },
      ],
      rows,
    );
  };

  const movementColumns = [
    { key: "date", header: "Tarih", className: "date-cell", render: (row) => formatDate(row.date) },
    { key: "type", header: "İşlem", render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge> },
    {
      key: "productCode",
      header: "Malzeme",
      render: (row) => (
        <div className="entity-name">
          <strong>{row.productCode || "—"}</strong>
          <span>{row.userName || "Kullanıcı yok"}</span>
        </div>
      ),
    },
    { key: "quantity", header: "Miktar", className: "numeric-cell" },
    { key: "userName", header: "Kullanıcı", render: (row) => row.userName || "-" },
  ];

  const warehouseColumns = [
    { key: "warehouseCode", header: "Kod", render: (row) => row.warehouseCode || "—" },
    { key: "warehouseName", header: "Depo", render: (row) => row.warehouseName || "—" },
    { key: "totalQuantity", header: "Toplam miktar", className: "numeric-cell" },
    { key: "lineCount", header: "Satır", className: "numeric-cell" },
  ];

  return (
    <div className="page reports-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Raporlama</span>
          <h1>Raporlar</h1>
          <p>
            Hareket, stok özeti ve depo karşılaştırması. Grafikler için <Link to="/analytics">Analitik</Link>, denetim
            için <Link to="/logs">Event Log</Link>.
          </p>
        </div>
        <div className="operation-actions">
          <Button variant="primary" onClick={exportRows} disabled={rows.length === 0}>
            CSV
          </Button>
          <Button onClick={exportExcel} disabled={rows.length === 0}>
            Excel
          </Button>
          <Button onClick={exportPdf} disabled={rows.length === 0}>
            PDF
          </Button>
          <Button onClick={() => downloadReportExport("csv")}>API Export</Button>
          <Button onClick={() => setShowEmail(true)}>E-posta ile gönder</Button>
        </div>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <div className="reports-tabs" role="tablist" aria-label="Rapor görünümü">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "movements"}
          className={tab === "movements" ? "active" : ""}
          onClick={() => setTab("movements")}
        >
          Hareketler
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "summary"}
          className={tab === "summary" ? "active" : ""}
          onClick={() => setTab("summary")}
        >
          Stok özeti
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "warehouses"}
          className={tab === "warehouses" ? "active" : ""}
          onClick={() => setTab("warehouses")}
        >
          Depo karşılaştırma
        </button>
      </div>

      <div className="stats-grid">
        <KpiCard label="Stok giriş (sayfa)" value={tabSummary.success} tone="green" />
        <KpiCard label="Stok çıkış (sayfa)" value={tabSummary.failed} tone="red" />
        <KpiCard label="Toplam hareket" value={meta.totalCount} tone="blue" />
        <KpiCard label="Kritik stok" value={summary?.lowStockCount ?? "—"} tone="amber" />
      </div>

      <FilterBar
        secondary={
          <>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
              aria-label="Bitiş tarihi"
            />
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
          </>
        }
        actions={<Button onClick={loadData}>Yenile</Button>}
      >
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => updateFilter("dateFrom", event.target.value)}
          aria-label="Başlangıç tarihi"
        />
      </FilterBar>

      {tab === "summary" && (
        <div className="reports-summary-grid">
          <article className="card">
            <div className="card-header">
              <div>
                <h2>Stok özeti</h2>
                <p className="list-card-meta">API stok özet raporu</p>
              </div>
            </div>
            <div className="stats-grid reports-inline-stats">
              <KpiCard label="Toplam miktar" value={summary?.totalQuantity ?? "—"} tone="blue" />
              <KpiCard label="Ürün" value={summary?.productCount ?? "—"} tone="green" />
              <KpiCard label="Depo" value={summary?.warehouseCount ?? "—"} tone="amber" />
              <KpiCard label="Boş satır" value={summary?.emptyStockLines ?? "—"} tone="red" />
            </div>
          </article>

          <article className="card">
            <div className="card-header">
              <div>
                <h2>Son 7 gün trend</h2>
                <p className="list-card-meta">Giriş / çıkış / transfer</p>
              </div>
            </div>
            {trend.length === 0 ? (
              <EmptyState icon={reportEmptyIcon} title="Trend verisi yok" text="Seçili dönemde hareket trendi bulunamadı." />
            ) : (
              <ul className="reports-trend-list">
                {trend.map((point) => (
                  <li key={point.label}>
                    <span className="reports-trend-label">{point.label}</span>
                    <div className="reports-trend-bars" aria-hidden="true">
                      <span style={{ width: `${(Number(point.inCount ?? 0) / maxTrend) * 100}%` }} className="in" />
                      <span style={{ width: `${(Number(point.outCount ?? 0) / maxTrend) * 100}%` }} className="out" />
                      <span
                        style={{ width: `${(Number(point.transferCount ?? 0) / maxTrend) * 100}%` }}
                        className="transfer"
                      />
                    </div>
                    <span className="reports-trend-meta">
                      +{point.inCount ?? 0} / −{point.outCount ?? 0} / ↔{point.transferCount ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      )}

      {tab === "warehouses" && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Depo karşılaştırma</h2>
              <p className="list-card-meta">
                <strong>{warehouses.length}</strong> depo
              </p>
            </div>
          </div>
          <DataTable
            columns={warehouseColumns}
            rows={warehouses}
            getRowKey={(row) => row.warehouseCode || row.warehouseName}
            loading={loading}
            empty={
              <EmptyState
                icon={reportEmptyIcon}
                title="Depo karşılaştırması yok"
                text="Karşılaştırma verisi gelmedi."
                action={<Button onClick={loadData}>Yenile</Button>}
              />
            }
          />
        </div>
      )}

      {tab === "movements" && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Hareket raporu</h2>
              <p className="list-card-meta">
                <strong>{meta.totalCount}</strong> kayıt · sayfa {meta.page}/{meta.totalPages || 1}
              </p>
            </div>
          </div>
          <DataTable
            columns={movementColumns}
            rows={rows}
            getRowKey={(row) => row.id}
            loading={loading}
            empty={
              <EmptyState
                icon={reportEmptyIcon}
                title="Rapor kaydı bulunamadı"
                text="Seçili filtrelerde veri yok."
                action={
                  <>
                    <Button onClick={clearFilters}>Filtreleri temizle</Button>
                    <Link to="/movements" className="btn btn-secondary">
                      Hareketlere git
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
      )}

      {showEmail && (
        <EmailReportDialog
          onClose={() => setShowEmail(false)}
          onDone={(result) => setMessage({ type: "success", text: result.message || "Rapor gönderildi." })}
        />
      )}
    </div>
  );
}

export default Reports;
