import { useCallback, useEffect, useState } from "react";
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
import { Button, EmptyState, FilterBar, KpiCard, Toast } from "../components/ui/CommonUI.jsx";
import EmailReportDialog from "../components/EmailReportDialog.jsx";
import { fetchDashboardSummary } from "../services/dashboardApi.js";
import { fetchLowStockAlerts } from "../services/alertApi.js";
import {
  fetchMovementTrend,
  fetchStockSummaryReport,
  fetchWarehouseComparison,
} from "../services/reportApi.js";
import { getChartColors } from "../utils/chartColors.js";
import "./Analytics.css";

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [granularity, setGranularity] = useState("daily");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState(null);
  const [stockSummary, setStockSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showEmail, setShowEmail] = useState(false);
  const [colors, setColors] = useState(getChartColors());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, stock, nextTrend, comparison, lowStock] = await Promise.all([
        fetchDashboardSummary(),
        fetchStockSummaryReport(),
        fetchMovementTrend(granularity, dateFrom || undefined, dateTo || undefined),
        fetchWarehouseComparison(),
        fetchLowStockAlerts(),
      ]);
      setSummary(dash);
      setStockSummary(stock);
      setTrend(Array.isArray(nextTrend) ? nextTrend : []);
      setWarehouses(Array.isArray(comparison) ? comparison : []);
      setAlerts(Array.isArray(lowStock) ? lowStock.slice(0, 8) : []);
      setColors(getChartColors());
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, [granularity, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const observer = new MutationObserver(() => setColors(getChartColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const categories = summary?.categoryStockDistribution ?? [];

  return (
    <div className="page analytics-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Analitik</span>
          <h1>Operasyon Analizi</h1>
          <p>Stok trendleri, depo karşılaştırması ve kritik stok görünümü.</p>
        </div>
        <div className="operation-actions">
          <Button onClick={load}>Yenile</Button>
          <Button variant="primary" onClick={() => setShowEmail(true)}>
            E-posta ile gönder
          </Button>
        </div>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <FilterBar actions={<Button onClick={load}>Uygula</Button>}>
        <select value={granularity} onChange={(e) => setGranularity(e.target.value)} aria-label="Granülarite">
          <option value="daily">Günlük</option>
          <option value="weekly">Haftalık</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} aria-label="Başlangıç" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} aria-label="Bitiş" />
      </FilterBar>

      {loading ? (
        <div className="skeleton-grid" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : (
        <>
          <section className="stats-grid" aria-label="KPI">
            <KpiCard label="Toplam stok" value={stockSummary?.totalQuantity ?? "—"} tone="blue" />
            <KpiCard label="Ürün" value={stockSummary?.productCount ?? "—"} tone="green" />
            <KpiCard label="Depo" value={stockSummary?.warehouseCount ?? "—"} tone="amber" />
            <KpiCard label="Kritik stok" value={stockSummary?.lowStockCount ?? "—"} tone="red" />
          </section>

          <section className="dashboard-grid">
            <article className="card chart-card">
              <div className="card-header">
                <div>
                  <h2>Hareket trendi</h2>
                  <p className="list-card-meta">{granularity === "daily" ? "Günlük" : "Haftalık"} görünüm</p>
                </div>
              </div>
              <div className="chart-box">
                {trend.length === 0 ? (
                  <EmptyState className="compact" title="Trend yok" text="Seçili dönemde hareket bulunamadı." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trend}>
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
                  <h2>Depo karşılaştırması</h2>
                  <p className="list-card-meta">
                    <strong>{warehouses.length}</strong> depo
                  </p>
                </div>
              </div>
              <div className="chart-box">
                {warehouses.length === 0 ? (
                  <EmptyState className="compact" title="Depo verisi yok" text="Karşılaştırma için stok satırı bulunamadı." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={warehouses.slice(0, 8)}>
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
                          <Cell
                            key={index}
                            fill={[colors.chart1, colors.chart2, colors.chart3, colors.chart4][index % 4]}
                          />
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
                <ul className="alert-list">
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

export default Analytics;
