import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const warehouseEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M3 21V8l9-5 9 5v13" />
    <path d="M9 21v-7h6v7" />
    <path d="M7 10h10" />
  </svg>
);

const categoryEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const movementEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M8 7h12m0 0l-4-4m4 4l-4 4M9 17H7a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
  </svg>
);

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

  const movementColumns = [
    { key: "date", header: "Tarih", render: (row) => formatDate(row.date) },
    { key: "type", header: "İşlem", render: (row) => <StatusBadge tone={row.typeCode}>{row.typeLabel}</StatusBadge> },
    {
      key: "productCode",
      header: "Malzeme",
      render: (row) => row.productName || row.productCode || "—",
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
                : sapStatus === "mock"
                  ? "Mock veri"
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
        <KpiCard
          label="Toplam Stok"
          value={summary?.totalStockQuantity ?? "—"}
          tone="green"
          helper={`${summary?.emptyStockLines ?? 0} stoksuz satır`}
        />
        <KpiCard label="Depo" value={summary?.warehouseCount ?? "—"} tone="amber" />
        <KpiCard
          label="Kritik Stok"
          value={summary?.lowStockCount ?? "—"}
          tone="red"
          helper={movements.length ? `${movements.length} son hareket` : undefined}
        />
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
              <EmptyState
                icon={warehouseEmptyIcon}
                title="Depo stoku yok"
                text="Henüz depo dağılımı yok. Depoları kontrol edin veya SAP senkronunu çalıştırın."
                action={
                  <>
                    <Link to="/warehouses" className="btn btn-secondary">
                      Depolar
                    </Link>
                    <Link to="/integrations" className="btn btn-secondary">
                      Entegrasyonlar
                    </Link>
                  </>
                }
              />
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
              <EmptyState
                icon={categoryEmptyIcon}
                title="Kategori verisi yok"
                text="Kategori dağılımı için ürün kataloğunu doldurun veya senkronlayın."
                action={
                  <Link to="/products" className="btn btn-secondary">
                    Ürünlere git
                  </Link>
                }
              />
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
          empty={
            <EmptyState
              icon={movementEmptyIcon}
              title="Hareket yok"
              text="Henüz stok hareketi kaydı bulunmuyor. Operasyonlardan giriş/çıkış yapabilirsiniz."
              action={
                <Link to="/operations" className="btn btn-primary">
                  Operasyona git
                </Link>
              }
            />
          }
        />
      </section>
    </div>
  );
}

export default Dashboard;
