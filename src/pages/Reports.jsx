import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { fetchLowStockAlerts } from "../services/alertApi.js";
import { fetchDashboardSummary } from "../services/dashboardApi.js";
import { fetchMovements, movementTypeOptions } from "../services/movementApi.js";
import {
  downloadReportExport,
  fetchMovementTrend,
  fetchStockSummaryReport,
  fetchWarehouseComparison,
} from "../services/reportApi.js";
import { getChartColors } from "../utils/chartColors.js";
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

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("tr-TR");
}

function buildExecutiveInsights({ summary, trend, warehouses, alerts, meta }) {
  const totals = trend.reduce(
    (acc, point) => {
      acc.in += Number(point.inCount ?? 0);
      acc.out += Number(point.outCount ?? 0);
      acc.transfer += Number(point.transferCount ?? 0);
      return acc;
    },
    { in: 0, out: 0, transfer: 0 },
  );
  const net = totals.in - totals.out;
  const topWarehouse = [...warehouses].sort((a, b) => Number(b.totalQuantity ?? 0) - Number(a.totalQuantity ?? 0))[0];
  const lowStock = Number(summary?.lowStockCount ?? alerts.length ?? 0);
  const emptyLines = Number(summary?.emptyStockLines ?? 0);

  const insights = [];

  if (trend.length > 0) {
    insights.push({
      tone: net >= 0 ? "positive" : "warning",
      title: "Dönem net stok hareketi",
      text:
        net >= 0
          ? `Seçili dönemde net ${formatNumber(net)} birim giriş fazlası var (giriş ${formatNumber(totals.in)}, çıkış ${formatNumber(totals.out)}).`
          : `Seçili dönemde net ${formatNumber(Math.abs(net))} birim çıkış fazlası var (giriş ${formatNumber(totals.in)}, çıkış ${formatNumber(totals.out)}).`,
    });
  } else {
    insights.push({
      tone: "neutral",
      title: "Hareket trendi",
      text: "Seçili tarih aralığında trend verisi bulunamadı. Filtreleri genişleterek yeniden deneyin.",
    });
  }

  if (topWarehouse) {
    insights.push({
      tone: "neutral",
      title: "En yüksek stoklu depo",
      text: `${topWarehouse.warehouseName || topWarehouse.warehouseCode} deposunda ${formatNumber(topWarehouse.totalQuantity)} birim stok bulunuyor.`,
    });
  }

  if (lowStock > 0) {
    insights.push({
      tone: "danger",
      title: "Kritik stok riski",
      text: `${formatNumber(lowStock)} kalemde stok eşiğin altında. Operasyon ve satın alma ekiplerinin önceliklendirmesi önerilir.`,
    });
  } else {
    insights.push({
      tone: "positive",
      title: "Kritik stok durumu",
      text: "Eşik altı kritik stok kaydı yok. Stok seviyeleri mevcut eşiklere göre sağlıklı görünüyor.",
    });
  }

  if (emptyLines > 0) {
    insights.push({
      tone: "warning",
      title: "Boş stok satırları",
      text: `${formatNumber(emptyLines)} stok satırı sıfır/boş. Depo düzeni ve malzeme kartları gözden geçirilmeli.`,
    });
  }

  insights.push({
    tone: "neutral",
    title: "Hareket hacmi",
    text: `Filtrelenmiş raporda toplam ${formatNumber(meta.totalCount)} hareket kaydı listeleniyor. Transfer: ${formatNumber(totals.transfer)}.`,
  });

  return { insights, totals, net, topWarehouse };
}

function Reports() {
  const [tab, setTab] = useState("executive");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", type: "", page: 1 });
  const [summary, setSummary] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [trend, setTrend] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showEmail, setShowEmail] = useState(false);
  const [colors, setColors] = useState(getChartColors());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stockSummary, nextTrend, comparison, dash, lowStock] = await Promise.all([
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
        fetchDashboardSummary(),
        fetchLowStockAlerts().catch(() => []),
      ]);
      setRows(data.items);
      setMeta({ page: data.page, pageSize: data.pageSize, totalPages: data.totalPages, totalCount: data.totalCount });
      setSummary(stockSummary);
      setTrend(Array.isArray(nextTrend) ? nextTrend : []);
      setWarehouses(Array.isArray(comparison) ? comparison : []);
      setDashboard(dash);
      setAlerts(Array.isArray(lowStock) ? lowStock.slice(0, 8) : []);
      setColors(getChartColors());
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

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(getChartColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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

  const executive = useMemo(
    () => buildExecutiveInsights({ summary, trend, warehouses, alerts, meta }),
    [summary, trend, warehouses, alerts, meta],
  );

  const categories = dashboard?.categoryStockDistribution ?? [];
  const chartPalette = [colors.chart1, colors.chart2, colors.chart3, colors.chart4];
  const recentTrend = trend.slice(-14);
  const warehouseChartData = warehouses.slice(0, 8);

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

  const exportPdf = async () => {
    try {
      const warehouseBars = [...warehouses]
        .sort((a, b) => Number(b.totalQuantity ?? 0) - Number(a.totalQuantity ?? 0))
        .slice(0, 5)
        .map((wh) => ({
          label: wh.warehouseName || wh.warehouseCode || "Depo",
          value: Number(wh.totalQuantity ?? 0),
          color: [30, 58, 95],
        }));

      await downloadPdfReport({
        title: "Hareket Raporu",
        fileName: "hareket-raporu",
        columns: [
          { label: "Tarih", value: (row) => formatDate(row.date) },
          { label: "İşlem", value: (row) => row.typeLabel ?? "" },
          { label: "Malzeme", value: (row) => row.productCode ?? "" },
          { label: "Miktar", value: (row) => String(row.quantity ?? "") },
          { label: "Kullanıcı", value: (row) => row.userName ?? "" },
        ],
        rows,
        kpis: [
          { label: "Toplam stok", value: formatNumber(summary?.totalQuantity) },
          { label: "Kritik stok", value: formatNumber(summary?.lowStockCount) },
          { label: "Toplam hareket", value: formatNumber(meta.totalCount) },
          {
            label: "Net hareket",
            value:
              executive.totals.in || executive.totals.out
                ? `${executive.net >= 0 ? "+" : ""}${formatNumber(executive.net)}`
                : "—",
          },
        ],
        insights: executive.insights.map((item) => ({ title: item.title, text: item.text })),
        movementBars: [
          { label: "Giriş", value: executive.totals.in, color: [5, 150, 105] },
          { label: "Çıkış", value: executive.totals.out, color: [190, 18, 60] },
          { label: "Transfer", value: executive.totals.transfer, color: [37, 99, 235] },
        ],
        warehouseBars,
      });
      setMessage({ type: "success", text: "PDF raporu indirildi." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "PDF oluşturulamadı." });
    }
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

  const tabs = [
    { id: "executive", label: "Yönetici özeti" },
    { id: "movements", label: "Hareketler" },
    { id: "summary", label: "Stok özeti" },
    { id: "warehouses", label: "Depo karşılaştırma" },
  ];

  return (
    <div className="page reports-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Raporlama</span>
          <h1>Raporlar</h1>
          <p>
            Yönetici özeti, hareketler, stok ve depo karşılaştırması. Detaylı analitik için{" "}
            <Link to="/analytics">Analitik</Link>, denetim için <Link to="/logs">Event Log</Link>.
          </p>
        </div>
        <div className="operation-actions">
          <Button variant="primary" onClick={exportRows} disabled={rows.length === 0}>
            CSV
          </Button>
          <Button onClick={exportExcel} disabled={rows.length === 0}>
            Excel
          </Button>
          <Button onClick={exportPdf} disabled={loading || (!rows.length && !summary)}>
            PDF
          </Button>
          <Button onClick={() => downloadReportExport("csv")}>API Export</Button>
          <Button onClick={() => setShowEmail(true)}>E-posta ile gönder</Button>
        </div>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <div className="reports-tabs" role="tablist" aria-label="Rapor görünümü">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="stats-grid">
        <KpiCard label="Toplam stok" value={formatNumber(summary?.totalQuantity)} tone="blue" />
        <KpiCard label="Kritik stok" value={formatNumber(summary?.lowStockCount)} tone="amber" />
        <KpiCard label="Toplam hareket" value={formatNumber(meta.totalCount)} tone="green" />
        <KpiCard
          label="Net hareket"
          value={
            executive.totals.in || executive.totals.out
              ? `${executive.net >= 0 ? "+" : ""}${formatNumber(executive.net)}`
              : "—"
          }
          tone={executive.net >= 0 ? "green" : "red"}
        />
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

      {loading && tab === "executive" ? (
        <div className="reports-skeleton-grid" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="reports-skeleton-card" />
          ))}
        </div>
      ) : null}

      {tab === "executive" && !loading && (
        <div className="reports-executive">
          <article className="card reports-exec-brief">
            <div className="card-header">
              <div>
                <h2>Yönetici özeti</h2>
                <p className="list-card-meta">
                  {summary?.productCount ?? "—"} ürün · {summary?.warehouseCount ?? "—"} depo · dönem net{" "}
                  <strong>
                    {executive.net >= 0 ? "+" : ""}
                    {formatNumber(executive.net)}
                  </strong>
                </p>
              </div>
            </div>
            <ul className="reports-insight-list">
              {executive.insights.map((item) => (
                <li key={item.title} className={`reports-insight reports-insight--${item.tone}`}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
          </article>

          <section className="reports-charts-grid" aria-label="Yönetici grafikleri">
            <article className="card chart-card">
              <div className="card-header">
                <div>
                  <h2>Hareket trendi</h2>
                  <p className="list-card-meta">Son {recentTrend.length || 0} gün · giriş / çıkış / transfer</p>
                </div>
              </div>
              <div className="chart-box">
                {recentTrend.length === 0 ? (
                  <EmptyState className="compact" title="Trend yok" text="Seçili dönemde hareket bulunamadı." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={recentTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis dataKey="label" stroke={colors.muted} tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} stroke={colors.muted} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="inCount" name="Giriş" stroke={colors.chartIn} strokeWidth={2} />
                      <Line type="monotone" dataKey="outCount" name="Çıkış" stroke={colors.chartOut} strokeWidth={2} />
                      <Line
                        type="monotone"
                        dataKey="transferCount"
                        name="Transfer"
                        stroke={colors.chartTransfer}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="card chart-card">
              <div className="card-header">
                <div>
                  <h2>Depo stok dağılımı</h2>
                  <p className="list-card-meta">
                    <strong>{warehouses.length}</strong> depo
                  </p>
                </div>
              </div>
              <div className="chart-box">
                {warehouseChartData.length === 0 ? (
                  <EmptyState className="compact" title="Depo verisi yok" text="Karşılaştırma için stok satırı bulunamadı." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={warehouseChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                      <XAxis dataKey="warehouseName" stroke={colors.muted} tick={{ fontSize: 11 }} />
                      <YAxis stroke={colors.muted} />
                      <Tooltip />
                      <Bar dataKey="totalQuantity" name="Miktar" fill={colors.chart1} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="card chart-card">
              <div className="card-header">
                <div>
                  <h2>Kategori dağılımı</h2>
                  <p className="list-card-meta">
                    <strong>{categories.length}</strong> kategori
                  </p>
                </div>
              </div>
              <div className="chart-box">
                {categories.length === 0 ? (
                  <EmptyState className="compact" title="Kategori yok" text="Dağılım verisi bulunamadı." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categories} dataKey="quantity" nameKey="name" outerRadius={100} label>
                        {categories.map((_, index) => (
                          <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="card chart-card">
              <div className="card-header">
                <div>
                  <h2>Kritik stok özeti</h2>
                  <p className="list-card-meta">
                    <strong>{alerts.length}</strong> satır
                  </p>
                </div>
              </div>
              {alerts.length === 0 ? (
                <EmptyState className="compact" title="Kritik stok yok" text="Eşik altı ürün bulunmuyor." />
              ) : (
                <ul className="reports-alert-list">
                  {alerts.map((a) => (
                    <li key={`${a.materialNo}-${a.warehouseId}`}>
                      <strong>{a.productName || a.materialNo}</strong>
                      <span>
                        {a.warehouseName}: <span className="num">{a.quantity}</span>/<span className="num">{a.minLevel}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </div>
      )}

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
              <KpiCard label="Toplam miktar" value={formatNumber(summary?.totalQuantity)} tone="blue" />
              <KpiCard label="Ürün" value={formatNumber(summary?.productCount)} tone="green" />
              <KpiCard label="Depo" value={formatNumber(summary?.warehouseCount)} tone="amber" />
              <KpiCard label="Boş satır" value={formatNumber(summary?.emptyStockLines)} tone="red" />
            </div>
          </article>

          <article className="card chart-card">
            <div className="card-header">
              <div>
                <h2>Hareket trendi</h2>
                <p className="list-card-meta">Günlük giriş / çıkış / transfer</p>
              </div>
            </div>
            <div className="chart-box">
              {recentTrend.length === 0 ? (
                <EmptyState className="compact" title="Trend verisi yok" text="Seçili dönemde hareket trendi bulunamadı." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={recentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="label" stroke={colors.muted} tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} stroke={colors.muted} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="inCount" name="Giriş" stroke={colors.chartIn} strokeWidth={2} />
                    <Line type="monotone" dataKey="outCount" name="Çıkış" stroke={colors.chartOut} strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="transferCount"
                      name="Transfer"
                      stroke={colors.chartTransfer}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>
        </div>
      )}

      {tab === "warehouses" && (
        <div className="reports-warehouse-layout">
          <article className="card chart-card">
            <div className="card-header">
              <div>
                <h2>Depo stok grafiği</h2>
                <p className="list-card-meta">
                  <strong>{warehouses.length}</strong> depo
                </p>
              </div>
            </div>
            <div className="chart-box">
              {warehouseChartData.length === 0 ? (
                <EmptyState className="compact" title="Depo verisi yok" text="Karşılaştırma verisi gelmedi." />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={warehouseChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="warehouseName" stroke={colors.muted} tick={{ fontSize: 11 }} />
                    <YAxis stroke={colors.muted} />
                    <Tooltip />
                    <Bar dataKey="totalQuantity" name="Miktar" fill={colors.chart1} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </article>

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
        </div>
      )}

      {tab === "movements" && (
        <>
          <div className="stats-grid reports-page-kpis">
            <KpiCard label="Stok giriş (sayfa)" value={tabSummary.success} tone="green" />
            <KpiCard label="Stok çıkış (sayfa)" value={tabSummary.failed} tone="red" />
            <KpiCard label="Transfer (sayfa)" value={tabSummary.transfer} tone="blue" />
            <KpiCard label="Sayfa kayıt" value={rows.length} tone="amber" />
          </div>
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
        </>
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
