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
import { fetchLogs } from "../services/logApi.js";
import { fetchMovements } from "../services/movementApi.js";
import { downloadCsv } from "../utils/csv.js";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("tr-TR");
}

function Reports() {
  const [activeTab, setActiveTab] = useState("movements");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", page: 1, action: "", entity: "", isSuccess: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const common = {
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : "",
        dateTo: filters.dateTo ? new Date(filters.dateTo) : "",
        page: filters.page,
        pageSize: 20,
      };
      const data =
        activeTab === "logs"
          ? await fetchLogs({
              ...common,
              action: filters.action,
              entity: filters.entity,
              isSuccess: filters.isSuccess,
            })
          : await fetchMovements(common);
      setRows(data.items);
      setMeta({ page: data.page, pageSize: data.pageSize, totalPages: data.totalPages, totalCount: data.totalCount });
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setFilters((current) => ({ ...current, page: 1 }));
  };

  const summary = useMemo(() => {
    if (activeTab === "logs") {
      return {
        success: rows.filter((row) => row.isSuccess).length,
        failed: rows.filter((row) => !row.isSuccess).length,
      };
    }

    return {
      success: rows.filter((row) => row.typeCode === "in").length,
      failed: rows.filter((row) => row.typeCode === "out").length,
    };
  }, [activeTab, rows]);

  const exportRows = () => {
    if (activeTab === "logs") {
      downloadCsv(
        "operasyon-loglari.csv",
        [
          { label: "Tarih", value: (row) => row.timestamp ?? "" },
          { label: "Kullanıcı", value: (row) => row.userName },
          { label: "Aksiyon", value: (row) => row.action },
          { label: "Varlık", value: (row) => row.entity },
          { label: "Başarılı", value: (row) => (row.isSuccess ? "Evet" : "Hayır") },
          { label: "Detay", value: (row) => row.details },
          { label: "Hata", value: (row) => row.errorMessage },
        ],
        rows,
      );
      return;
    }

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

  const movementColumns = [
    { key: "date", header: "Tarih", render: (row) => formatDate(row.date) },
    { key: "type", header: "İşlem", render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge> },
    { key: "productCode", header: "Malzeme" },
    { key: "quantity", header: "Miktar", className: "numeric-cell" },
    { key: "userName", header: "Kullanıcı", render: (row) => row.userName || "-" },
  ];

  const logColumns = [
    { key: "timestamp", header: "Tarih", render: (row) => formatDate(row.timestamp) },
    { key: "userName", header: "Kullanıcı", render: (row) => row.userName || `#${row.userId}` },
    { key: "action", header: "Aksiyon" },
    { key: "entity", header: "Varlık" },
    {
      key: "isSuccess",
      header: "Durum",
      render: (row) => <StatusBadge tone={row.isSuccess ? "success" : "danger"}>{row.isSuccess ? "Başarılı" : "Hata"}</StatusBadge>,
    },
    { key: "details", header: "Detay", render: (row) => row.errorMessage || row.details || "-" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Raporlama</span>
          <h1>Raporlar ve Loglar</h1>
          <p>Hareket raporlarını ve yönetim loglarını tarih aralığına göre izleyip CSV olarak dışa aktarın.</p>
        </div>
        <Button variant="primary" onClick={exportRows} disabled={rows.length === 0}>CSV Dışa Aktar</Button>
      </div>

      <Toast message={message} />

      <div className="operation-actions" style={{ marginBottom: 16 }}>
        <Button variant={activeTab === "movements" ? "primary" : "secondary"} onClick={() => switchTab("movements")}>
          Hareket Raporu
        </Button>
        <Button variant={activeTab === "logs" ? "primary" : "secondary"} onClick={() => switchTab("logs")}>
          Operasyon Logları
        </Button>
      </div>

      <div className="mini-grid">
        <article className="panel-card">
          <span className="eyebrow">{activeTab === "logs" ? "Başarılı log" : "Stok giriş"}</span>
          <h2>{summary.success}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">{activeTab === "logs" ? "Hatalı log" : "Stok çıkış"}</span>
          <h2>{summary.failed}</h2>
        </article>
        <article className="panel-card">
          <span className="eyebrow">Toplam</span>
          <h2>{meta.totalCount}</h2>
        </article>
      </div>

      <FilterBar>
        <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} />
        <input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} />
        {activeTab === "logs" && (
          <>
            <input value={filters.action} onChange={(event) => updateFilter("action", event.target.value)} placeholder="Aksiyon" />
            <input value={filters.entity} onChange={(event) => updateFilter("entity", event.target.value)} placeholder="Varlık" />
            <select value={filters.isSuccess} onChange={(event) => updateFilter("isSuccess", event.target.value)}>
              <option value="">Tüm durumlar</option>
              <option value="true">Başarılı</option>
              <option value="false">Hatalı</option>
            </select>
          </>
        )}
        <Button onClick={loadData}>Yenile</Button>
      </FilterBar>

      <div className="card">
        <DataTable
          columns={activeTab === "logs" ? logColumns : movementColumns}
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
    </div>
  );
}

export default Reports;
