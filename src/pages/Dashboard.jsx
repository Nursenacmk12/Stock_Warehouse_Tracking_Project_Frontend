import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, DataTable, EmptyState, KpiCard, StatusBadge, Toast } from "../components/ui/CommonUI.jsx";
import { useDashboardSummary } from "../hooks/useQueries.js";
import { useStockHub } from "../hooks/useStockHub.js";
import { queryKeys } from "../lib/queryClient.js";
import "./Dashboard.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("tr-TR");
}

function Dashboard() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading, isError, error, refetch } = useDashboardSummary();
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (isError) {
      setMessage({ type: "error", text: error?.message ?? "Dashboard yüklenemedi." });
    }
  }, [isError, error]);

  const loadData = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
  }, [refetch, queryClient]);

  useStockHub(() => {
    loadData();
  });

  const sapStatus = summary?.sapStatus ?? "checking";
  const warehouseTotals = summary?.warehouseStockDistribution ?? [];
  const categoryTotals = summary?.categoryStockDistribution ?? [];
  const movements = summary?.recentMovements ?? [];

  const maxWarehouseQuantity = Math.max(1, ...warehouseTotals.map((item) => item.quantity));
  const maxCategoryQuantity = Math.max(1, ...categoryTotals.map((item) => item.quantity));

  const productByCode = useMemo(() => ({}), []);

  const movementColumns = [
    { key: "date", header: "Tarih", render: (row) => formatDate(row.date) },
    { key: "type", header: "İşlem", render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge> },
    {
      key: "productCode",
      header: "Malzeme",
      render: (row) => productByCode[row.productCode]?.name ?? row.productCode,
    },
    { key: "quantity", header: "Miktar", className: "numeric-cell" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Genel bakış</span>
          <h1>Gösterge Paneli</h1>
          <p>SAP stok sağlığı, operasyon hacmi ve depo dağılımını canlı API verileriyle izleyin.</p>
        </div>
        <Button onClick={loadData}>Yenile</Button>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <section className="sap-status-bar" aria-label="SAP bağlantı durumu">
        <div className={`sap-indicator ${sapStatus}`}>
          <span className="sap-dot" />
          <strong>SAP Bağlantısı</strong>
          <span>
            {sapStatus === "checking" || isLoading
              ? "Kontrol ediliyor..."
              : sapStatus === "healthy"
                ? "Aktif"
                : "Bağlantı kesik"}
          </span>
        </div>
      </section>

      <section className="stats-grid" aria-label="Operasyon özeti">
        <KpiCard
          label="Toplam Ürün"
          value={summary?.productCount ?? "—"}
          tone="blue"
          helper={`${summary?.sapOnlyProductCount ?? 0} SAP katalog`}
        />
        <KpiCard label="Toplam Stok" value={summary?.totalStockQuantity ?? "—"} tone="green" />
        <KpiCard label="Depo" value={summary?.warehouseCount ?? "—"} tone="amber" />
        <KpiCard label="Stoksuz Satır" value={summary?.emptyStockLines ?? "—"} tone="red" />
        <KpiCard label="Kritik Stok" value={summary?.lowStockCount ?? "—"} tone="red" />
        <KpiCard label="Son Hareket" value={movements.length} tone="teal" />
      </section>

      <section className="dashboard-grid">
        <article className="card chart-card">
          <div className="card-header">
            <div>
              <h2>Depo Bazlı Stok</h2>
              <p>En yüksek miktara sahip depo stokları</p>
            </div>
          </div>
          <div className="bar-list">
            {warehouseTotals.length === 0 ? (
              <EmptyState title="Depo stoku yok" text="SAP stok servisi depo dağılımı döndürmedi." />
            ) : (
              warehouseTotals.map((item) => (
                <div className="bar-row" key={item.code}>
                  <header>
                    <strong>{item.name}</strong>
                    <span>{item.quantity}</span>
                  </header>
                  <div className="bar-track">
                    <span style={{ width: `${Math.round((item.quantity / maxWarehouseQuantity) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card chart-card">
          <div className="card-header">
            <div>
              <h2>Kategori Stok Dağılımı</h2>
              <p>Ürün kategorilerine göre toplam stok</p>
            </div>
          </div>
          <div className="bar-list">
            {categoryTotals.length === 0 ? (
              <EmptyState title="Kategori verisi yok" text="Ürün kataloğunda kategori alanı bulunmuyor." />
            ) : (
              categoryTotals.map((item) => (
                <div className="bar-row" key={item.name}>
                  <header>
                    <strong>{item.name}</strong>
                    <span>{item.quantity}</span>
                  </header>
                  <div className="bar-track">
                    <span style={{ width: `${Math.round((item.quantity / maxCategoryQuantity) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2>Son Stok Hareketleri</h2>
            <p>API'den gelen en güncel operasyon kayıtları</p>
          </div>
        </div>
        <DataTable
          columns={movementColumns}
          rows={movements}
          getRowKey={(row) => row.id}
          loading={isLoading}
          empty={<EmptyState title="Hareket yok" text="Henüz stok hareketi kaydı bulunmuyor." />}
        />
      </section>
    </div>
  );
}

export default Dashboard;
