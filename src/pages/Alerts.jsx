import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  StatusBadge,
  TextInput,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { updateStockThreshold } from "../services/alertApi.js";
import { useLowStockAlerts } from "../hooks/useQueries.js";
import { queryKeys } from "../lib/queryClient.js";

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
    { key: "productName", header: "Ürün" },
    { key: "materialNo", header: "Kod" },
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
      header: "",
      render: (row) => (
        <Button
          variant="secondary"
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
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ürün veya depo ara" />
      </FilterBar>

      <div className="card">
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => `${row.materialNo}-${row.warehouseId}`}
          loading={isLoading}
          empty={<EmptyState title="Kritik stok yok" text="Tüm stoklar tanımlı eşiklerin üzerinde." />}
        />
      </div>

      {editing && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Eşik Güncelle — {editing.productName}</h2>
          <TextInput
            label="Min seviye"
            type="number"
            min="0"
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value)}
          />
          <div className="operation-actions">
            <Button variant="primary" onClick={handleSaveThreshold} disabled={busy}>
              Kaydet
            </Button>
            <Button onClick={() => setEditing(null)} disabled={busy}>
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;
