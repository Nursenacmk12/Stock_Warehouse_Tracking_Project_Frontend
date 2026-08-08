import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  Modal,
  StatusBadge,
  TextInput,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { updateStockThreshold } from "../services/alertApi.js";
import { useLowStockAlerts } from "../hooks/useQueries.js";
import { queryKeys } from "../lib/queryClient.js";

const alertEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

function Alerts() {
  const queryClient = useQueryClient();
  const { data: alerts = [], isLoading, refetch } = useLowStockAlerts();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editing, setEditing] = useState(null);
  const [minLevel, setMinLevel] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = alerts.filter((row) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      row.materialNo.toLowerCase().includes(term) ||
      row.productName.toLowerCase().includes(term) ||
      row.warehouseName.toLowerCase().includes(term)
    );
  });

  const handleSaveThreshold = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await updateStockThreshold(editing.materialNo, editing.warehouseId, minLevel);
      setMessage({ type: "success", text: "Min seviye güncellendi." });
      setEditing(null);
      await refetch();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "productName",
      header: "Ürün",
      render: (row) => (
        <div className="entity-name">
          <strong>{row.productName}</strong>
          <span>{row.materialNo}</span>
        </div>
      ),
    },
    { key: "warehouseName", header: "Depo" },
    { key: "quantity", header: "Mevcut", className: "numeric-cell" },
    { key: "minLevel", header: "Min", className: "numeric-cell" },
    {
      key: "deficit",
      header: "Eksik",
      className: "numeric-cell",
      render: (row) => <StatusBadge tone="danger">{row.deficit}</StatusBadge>,
    },
    {
      key: "actions",
      header: "İşlemler",
      render: (row) => (
        <Button
          onClick={() => {
            setEditing(row);
            setMinLevel(String(row.minLevel));
          }}
        >
          Eşik düzenle
        </Button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Uyarılar</span>
          <h1>Kritik Stok Uyarıları</h1>
          <p>Min seviyenin altına düşen stok satırlarını izleyin ve eşik değerlerini güncelleyin.</p>
        </div>
        <Button onClick={() => refetch()}>Yenile</Button>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <FilterBar>
        <input
          className="filter-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün, kod veya depo ara"
          aria-label="Uyarı ara"
        />
      </FilterBar>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Kritik stok listesi</h2>
            <p className="list-card-meta">
              <strong>{rows.length}</strong> uyarı gösteriliyor
            </p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => `${row.materialNo}-${row.warehouseId}`}
          loading={isLoading}
          empty={
            <EmptyState
              icon={alertEmptyIcon}
              title="Kritik stok yok"
              text="Tüm stoklar tanımlı eşiklerin üzerinde."
              action={
                <Link to="/stocks" className="btn btn-secondary">
                  Stoklara git
                </Link>
              }
            />
          }
        />
      </div>

      {editing && (
        <Modal title={`Eşik Güncelle — ${editing.productName}`} onClose={() => setEditing(null)} size="modal-sm">
          <div className="modal-body">
            <p className="confirm-text">
              {editing.materialNo} · {editing.warehouseName}
            </p>
            <TextInput
              label="Min seviye"
              type="number"
              min="0"
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
            />
            <div className="modal-footer">
              <Button onClick={() => setEditing(null)} disabled={busy}>
                Vazgeç
              </Button>
              <Button variant="primary" onClick={handleSaveThreshold} disabled={busy}>
                {busy ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Alerts;
