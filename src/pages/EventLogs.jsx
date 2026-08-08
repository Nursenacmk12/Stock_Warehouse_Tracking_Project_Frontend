import { useCallback, useEffect, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  Pagination,
  StatusBadge,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { downloadLogsExport, fetchLogById, fetchLogMeta, fetchLogs } from "../services/logApi.js";
import "./EventLogs.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("tr-TR");
}

function severityTone(severity) {
  if (severity === "Error") return "danger";
  if (severity === "Warning") return "warning";
  return "info";
}

function EventLogs() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [catalog, setCatalog] = useState({ actions: [], entities: [], sources: [], severities: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    action: "",
    entity: "",
    source: "",
    severity: "",
    isSuccess: "",
    q: "",
    dateFrom: "",
    dateTo: "",
  });

  const loadMeta = useCallback(async () => {
    try {
      const data = await fetchLogMeta();
      setCatalog({
        actions: data.actions ?? [],
        entities: data.entities ?? [],
        sources: data.sources ?? ["User", "System", "Integration"],
        severities: data.severities ?? ["Info", "Warning", "Error"],
      });
    } catch {
      /* ignore */
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs({
        ...filters,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : "",
        dateTo: filters.dateTo ? new Date(filters.dateTo) : "",
        pageSize: 20,
      });
      setRows(data.items);
      setMeta({ page: data.page, pageSize: data.pageSize, totalPages: data.totalPages, totalCount: data.totalCount });
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const openDetail = async (row) => {
    try {
      const detail = await fetchLogById(row.logId);
      setSelected(detail);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const columns = [
    { key: "timestamp", header: "Tarih", render: (row) => formatDate(row.timestamp) },
    { key: "source", header: "Kaynak", render: (row) => <StatusBadge tone="info">{row.source}</StatusBadge> },
    {
      key: "severity",
      header: "Seviye",
      render: (row) => <StatusBadge tone={severityTone(row.severity)}>{row.severity}</StatusBadge>,
    },
    { key: "action", header: "Aksiyon" },
    { key: "entity", header: "Varlık" },
    {
      key: "actor",
      header: "Aktör",
      render: (row) => row.actorUserName || row.userName || (row.actorUserId ? `#${row.actorUserId}` : "—"),
    },
    {
      key: "isSuccess",
      header: "Durum",
      render: (row) => (
        <StatusBadge tone={row.isSuccess ? "success" : "danger"}>{row.isSuccess ? "OK" : "Hata"}</StatusBadge>
      ),
    },
    {
      key: "open",
      header: "",
      render: (row) => (
        <Button onClick={() => openDetail(row)} className="btn-sm">
          Detay
        </Button>
      ),
    },
  ];

  return (
    <div className="page event-logs-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Denetim</span>
          <h1>Event Log</h1>
          <p>Kullanıcı ve sistem olaylarını filtreleyin, detayını inceleyin ve dışa aktarın.</p>
        </div>
        <div className="operation-actions">
          <Button className="filters-toggle" onClick={() => setFiltersOpen((v) => !v)}>
            Filtreler
          </Button>
          <Button onClick={loadData}>Yenile</Button>
          <Button
            variant="primary"
            onClick={() =>
              downloadLogsExport(filters).catch((e) => setMessage({ type: "error", text: e.message }))
            }
          >
            CSV Export
          </Button>
        </div>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <div className={`event-filters ${filtersOpen ? "open" : ""}`}>
        <FilterBar>
          <input type="date" value={filters.dateFrom} onChange={(e) => updateFilter("dateFrom", e.target.value)} />
          <input type="date" value={filters.dateTo} onChange={(e) => updateFilter("dateTo", e.target.value)} />
          <input
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            placeholder="Ara (detay/hata)"
          />
          <select value={filters.source} onChange={(e) => updateFilter("source", e.target.value)}>
            <option value="">Tüm kaynaklar</option>
            {catalog.sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={filters.severity} onChange={(e) => updateFilter("severity", e.target.value)}>
            <option value="">Tüm seviyeler</option>
            {catalog.severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)}>
            <option value="">Tüm aksiyonlar</option>
            {catalog.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select value={filters.entity} onChange={(e) => updateFilter("entity", e.target.value)}>
            <option value="">Tüm varlıklar</option>
            {catalog.entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <select value={filters.isSuccess} onChange={(e) => updateFilter("isSuccess", e.target.value)}>
            <option value="">Tüm durumlar</option>
            <option value="true">Başarılı</option>
            <option value="false">Hatalı</option>
          </select>
        </FilterBar>
      </div>

      <div className="event-layout">
        <div className="card">
          {loading ? (
            <div className="skeleton-table" aria-busy="true" />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.logId}
                empty={<EmptyState title="Kayıt yok" text="Filtrelerinize uygun event bulunamadı." />}
                loading={false}
              />
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                totalCount={meta.totalCount}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              />
            </>
          )}
        </div>

        <aside className={`event-detail ${selected ? "open" : ""}`}>
          {selected ? (
            <div className="card detail-card">
              <div className="card-header">
                <h2>Log #{selected.logId}</h2>
                <Button onClick={() => setSelected(null)}>Kapat</Button>
              </div>
              <dl className="detail-grid">
                <dt>Tarih</dt>
                <dd>{formatDate(selected.timestamp)}</dd>
                <dt>Kaynak</dt>
                <dd>{selected.source}</dd>
                <dt>Seviye</dt>
                <dd>{selected.severity}</dd>
                <dt>Aksiyon</dt>
                <dd>{selected.action}</dd>
                <dt>Varlık</dt>
                <dd>{selected.entity}</dd>
                <dt>Aktör</dt>
                <dd>{selected.actorUserName || selected.actorUserId || "—"}</dd>
                <dt>Hedef kullanıcı</dt>
                <dd>{selected.userName || selected.userId || "—"}</dd>
                <dt>Durum</dt>
                <dd>{selected.isSuccess ? "Başarılı" : "Hata"}</dd>
                <dt>Detay</dt>
                <dd>{selected.details || "—"}</dd>
                <dt>Hata</dt>
                <dd>{selected.errorMessage || "—"}</dd>
              </dl>
            </div>
          ) : (
            <div className="card detail-card muted-panel">
              <EmptyState title="Detay seçilmedi" text="Tablodan bir kayıt seçerek ayrıntıyı görün." />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default EventLogs;
