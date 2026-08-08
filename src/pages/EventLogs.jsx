import { useCallback, useEffect, useState } from "react";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  LoadingState,
  Modal,
  Pagination,
  StatusBadge,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { downloadLogsExport, fetchLogById, fetchLogMeta, fetchLogs } from "../services/logApi.js";
import "./EventLogs.css";

const logEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M8 6h13" />
    <path d="M8 12h13" />
    <path d="M8 18h13" />
    <path d="M3 6h.01" />
    <path d="M3 12h.01" />
    <path d="M3 18h.01" />
  </svg>
);

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

function parseDetailPairs(details) {
  if (!details || typeof details !== "string") return null;
  const trimmed = details.trim();
  if (!trimmed.includes("=")) return null;

  const parts = trimmed.split(/,\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const pairs = [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) return null;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (!/^[A-Za-z][\w.]*$/.test(key) || !value) return null;
    pairs.push({ key, value });
  }

  return pairs.length >= 2 ? pairs : null;
}

function DetailValue({ value, multiline = false, parsePairs = false }) {
  const text = value == null || value === "" ? "—" : String(value);
  const pairs = parsePairs ? parseDetailPairs(text) : null;

  if (pairs) {
    return (
      <div className="detail-kv-chips" role="list">
        {pairs.map((pair) => (
          <span className="detail-kv-chip" role="listitem" key={`${pair.key}-${pair.value}`}>
            <span className="detail-kv-key">{pair.key}</span>
            <span className="detail-kv-val">{pair.value}</span>
          </span>
        ))}
      </div>
    );
  }

  if (multiline && text !== "—") {
    return <pre className="detail-code">{text}</pre>;
  }

  return <span className={multiline ? "detail-code-inline" : undefined}>{text}</span>;
}

const emptyFilters = {
  page: 1,
  action: "",
  entity: "",
  source: "",
  severity: "",
  isSuccess: "",
  q: "",
  dateFrom: "",
  dateTo: "",
};

function EventLogDetailBody({ selected }) {
  return (
    <dl className="detail-grid">
      <div className="detail-row">
        <dt>Kaynak</dt>
        <dd>
          <StatusBadge tone="info">{selected.source}</StatusBadge>
        </dd>
      </div>
      <div className="detail-row">
        <dt>Seviye</dt>
        <dd>
          <StatusBadge tone={severityTone(selected.severity)}>{selected.severity}</StatusBadge>
        </dd>
      </div>
      <div className="detail-row">
        <dt>Aksiyon</dt>
        <dd>
          <DetailValue value={selected.action} />
        </dd>
      </div>
      <div className="detail-row">
        <dt>Varlık</dt>
        <dd>
          <DetailValue value={selected.entity} />
        </dd>
      </div>
      <div className="detail-row">
        <dt>Aktör</dt>
        <dd>
          <DetailValue value={selected.actorUserName || selected.actorUserId || "—"} />
        </dd>
      </div>
      <div className="detail-row">
        <dt>Hedef kullanıcı</dt>
        <dd>
          <DetailValue value={selected.userName || selected.userId || "—"} />
        </dd>
      </div>
      <div className="detail-row">
        <dt>Durum</dt>
        <dd>
          <StatusBadge tone={selected.isSuccess ? "success" : "danger"}>
            {selected.isSuccess ? "Başarılı" : "Hata"}
          </StatusBadge>
        </dd>
      </div>
      <div className="detail-row detail-row-block">
        <dt>Detay</dt>
        <dd>
          <DetailValue value={selected.details} multiline parsePairs />
        </dd>
      </div>
      <div className="detail-row detail-row-block">
        <dt>Hata</dt>
        <dd>
          <DetailValue value={selected.errorMessage} multiline />
        </dd>
      </div>
    </dl>
  );
}

function EventLogs() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [catalog, setCatalog] = useState({ actions: [], entities: [], sources: [], severities: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [useModalDetail, setUseModalDetail] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1100px)").matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1100px)");
    const onChange = () => setUseModalDetail(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSelected(null);
  };

  const openDetail = async (row) => {
    try {
      const detail = await fetchLogById(row.logId);
      setSelected(detail);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const closeDetail = () => setSelected(null);

  const columns = [
    { key: "timestamp", header: "Tarih", className: "date-cell", render: (row) => formatDate(row.timestamp) },
    { key: "source", header: "Kaynak", render: (row) => <StatusBadge tone="info">{row.source}</StatusBadge> },
    {
      key: "severity",
      header: "Seviye",
      render: (row) => <StatusBadge tone={severityTone(row.severity)}>{row.severity}</StatusBadge>,
    },
    {
      key: "action",
      header: "Aksiyon",
      render: (row) => (
        <div className="entity-name">
          <strong>{row.action}</strong>
          <span>{row.entity || "—"}</span>
        </div>
      ),
    },
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
      header: "İşlemler",
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
        <FilterBar
          secondary={
            <>
              <select value={filters.source} onChange={(e) => updateFilter("source", e.target.value)} aria-label="Kaynak">
                <option value="">Tüm kaynaklar</option>
                {catalog.sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={filters.severity}
                onChange={(e) => updateFilter("severity", e.target.value)}
                aria-label="Seviye"
              >
                <option value="">Tüm seviyeler</option>
                {catalog.severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} aria-label="Aksiyon">
                <option value="">Tüm aksiyonlar</option>
                {catalog.actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select value={filters.entity} onChange={(e) => updateFilter("entity", e.target.value)} aria-label="Varlık">
                <option value="">Tüm varlıklar</option>
                {catalog.entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <select
                value={filters.isSuccess}
                onChange={(e) => updateFilter("isSuccess", e.target.value)}
                aria-label="Durum"
              >
                <option value="">Tüm durumlar</option>
                <option value="true">Başarılı</option>
                <option value="false">Hatalı</option>
              </select>
            </>
          }
          actions={<Button onClick={clearFilters}>Temizle</Button>}
        >
          <input
            className="filter-search"
            type="search"
            value={filters.q}
            onChange={(e) => updateFilter("q", e.target.value)}
            placeholder="Ara (detay/hata)"
            aria-label="Log ara"
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter("dateFrom", e.target.value)}
            aria-label="Başlangıç tarihi"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter("dateTo", e.target.value)}
            aria-label="Bitiş tarihi"
          />
        </FilterBar>
      </div>

      <div className={`event-layout ${selected && !useModalDetail ? "has-detail" : ""}`}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Olay kayıtları</h2>
              <p className="list-card-meta">
                <strong>{meta.totalCount}</strong> kayıt · sayfa {meta.page}/{meta.totalPages || 1}
              </p>
            </div>
          </div>
          {loading ? (
            <LoadingState text="Loglar yükleniyor..." />
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.logId}
                empty={
                  <EmptyState
                    icon={logEmptyIcon}
                    title="Kayıt yok"
                    text="Filtrelerinize uygun event bulunamadı."
                    action={<Button onClick={clearFilters}>Filtreleri temizle</Button>}
                  />
                }
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

        {!useModalDetail && (
          <aside className={`event-detail ${selected ? "open" : ""}`}>
            {selected ? (
              <div className="card detail-card">
                <div className="card-header detail-card-header">
                  <div>
                    <span className="eyebrow">Kayıt detayı</span>
                    <h2>Log #{selected.logId}</h2>
                    <p className="list-card-meta">{formatDate(selected.timestamp)}</p>
                  </div>
                  <Button onClick={closeDetail} className="btn-sm" aria-label="Detayı kapat">
                    Kapat
                  </Button>
                </div>
                <div className="detail-card-body">
                  <EventLogDetailBody selected={selected} />
                </div>
              </div>
            ) : (
              <div className="card detail-card muted-panel">
                <EmptyState
                  className="compact"
                  icon={logEmptyIcon}
                  title="Detay seçilmedi"
                  text="Tablodan bir kayıt seçerek ayrıntıyı görün."
                />
              </div>
            )}
          </aside>
        )}
      </div>

      {useModalDetail && selected && (
        <Modal title={`Log #${selected.logId}`} onClose={closeDetail} size="modal-lg">
          <div className="modal-body event-log-modal-body">
            <p className="list-card-meta event-log-modal-meta">{formatDate(selected.timestamp)}</p>
            <EventLogDetailBody selected={selected} />
            <div className="modal-footer">
              <Button onClick={closeDetail}>Kapat</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default EventLogs;
