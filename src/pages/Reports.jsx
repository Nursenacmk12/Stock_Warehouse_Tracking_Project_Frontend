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
import { fetchMovements } from "../services/movementApi.js";
import { downloadReportExport, fetchStockSummaryReport } from "../services/reportApi.js";
import { downloadCsv } from "../utils/csv.js";
import { downloadExcelFromRows } from "../utils/excel.js";
import { downloadPdfReport } from "../utils/pdf.js";

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
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", page: 1 });
  const [summary, setSummary] = useState(null);
  const [showEmail, setShowEmail] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stockSummary] = await Promise.all([
        fetchMovements({
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : "",
          dateTo: filters.dateTo ? new Date(filters.dateTo) : "",
          page: filters.page,
          pageSize: 20,
        }),
        fetchStockSummaryReport(),
      ]);
      setRows(data.items);
      setMeta({ page: data.page, pageSize: data.pageSize, totalPages: data.totalPages, totalCount: data.totalCount });
      setSummary(stockSummary);
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
    setFilters({ dateFrom: "", dateTo: "", page: 1 });
  };

  const tabSummary = useMemo(
    () => ({
      success: rows.filter((row) => row.typeCode === "in").length,
      failed: rows.filter((row) => row.typeCode === "out").length,
      transfer: rows.filter((row) => row.typeCode === "transfer").length,
    }),
    [rows],
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Raporlama</span>
          <h1>Raporlar</h1>
          <p>
            Hareket dışa aktarma ve özet. Grafikler için <Link to="/analytics">Analitik</Link>, denetim için{" "}
            <Link to="/logs">Event Log</Link>.
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

      <div className="stats-grid">
        <KpiCard label="Stok giriş (sayfa)" value={tabSummary.success} tone="green" />
        <KpiCard label="Stok çıkış (sayfa)" value={tabSummary.failed} tone="red" />
        <KpiCard label="Toplam hareket" value={meta.totalCount} tone="blue" />
        <KpiCard label="Kritik stok" value={summary?.lowStockCount ?? "—"} tone="amber" />
      </div>

      <FilterBar
        secondary={
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter("dateTo", event.target.value)}
            aria-label="Bitiş tarihi"
          />
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
