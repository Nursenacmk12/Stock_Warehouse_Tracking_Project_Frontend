import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
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

  const tabSummary = useMemo(
    () => ({
      success: rows.filter((row) => row.typeCode === "in").length,
      failed: rows.filter((row) => row.typeCode === "out").length,
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
    { key: "date", header: "Tarih", render: (row) => formatDate(row.date) },
    { key: "type", header: "İşlem", render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge> },
    { key: "productCode", header: "Malzeme" },
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

      <div className="mini-grid">
        <article className="panel-card">
          <span className="eyebrow">Stok giriş</span>
          <h2>{tabSummary.success}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">Stok çıkış</span>
          <h2>{tabSummary.failed}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">Toplam hareket</span>
          <h2>{meta.totalCount}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">Kritik stok</span>
          <h2>{summary?.lowStockCount ?? "—"}</h2>
        </article>
      </div>

      <FilterBar>
        <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} />
        <input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} />
        <Button onClick={loadData}>Yenile</Button>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={movementColumns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          empty={<EmptyState title="Rapor kaydı bulunamadı" text="Seçili filtrelerde veri yok." />}
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
