import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { Button, SelectInput, TextInput, Toast } from "../components/ui/CommonUI.jsx";
import { stockIn, stockOut, transferStock, fetchStockDetail, fetchStocks } from "../services/stockApi.js";
import { useProducts, useWarehouses } from "../hooks/useQueries.js";
import { useStockHub } from "../hooks/useStockHub.js";
import { queryKeys } from "../lib/queryClient.js";
import "./Operations.css";

const emptyForm = {
  action: "in",
  materialNo: "",
  warehouseId: "",
  sourceWarehouseId: "",
  destWarehouseId: "",
  quantity: "1",
  refNo: "",
};

const ACTIONS = [
  { id: "in", label: "Giriş", hint: "Depoya stok ekle", tone: "in" },
  { id: "out", label: "Çıkış", hint: "Depodan stok düş", tone: "out" },
  { id: "transfer", label: "Transfer", hint: "Depolar arası taşı", tone: "transfer" },
];

const QTY_PRESETS = [1, 5, 10, 25, 50];
const HISTORY_LIMIT = 8;

function formatTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function actionLabel(action) {
  return ACTIONS.find((item) => item.id === action)?.label ?? action;
}

function Operations() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const [form, setForm] = useState(emptyForm);
  const [productFilter, setProductFilter] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stockDetail, setStockDetail] = useState(null);
  const [sourceDetail, setSourceDetail] = useState(null);
  const [destDetail, setDestDetail] = useState(null);
  const [history, setHistory] = useState([]);
  const [relatedStocks, setRelatedStocks] = useState([]);
  const scannerRef = useRef(null);
  const detailRequestRef = useRef(0);
  const scannerId = "operations-barcode-scanner";

  useEffect(() => {
    if (warehouses.length > 0 && !form.warehouseId) {
      setForm((current) => ({
        ...current,
        warehouseId: warehouses[0].code,
        sourceWarehouseId: warehouses[0].code,
        destWarehouseId: warehouses[1]?.code ?? warehouses[0].code,
      }));
    }
  }, [warehouses, form.warehouseId]);

  const invalidateCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stocks({}) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    queryClient.invalidateQueries({ queryKey: queryKeys.lowStockAlerts });
  }, [queryClient]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* scanner already stopped */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = async () => {
    await stopScanner();
    setScanning(true);
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decoded) => {
        setForm((current) => ({ ...current, materialNo: decoded.trim() }));
        setMessage({ type: "success", text: `Barkod okundu: ${decoded}` });
        stopScanner();
      },
    );
  };

  useEffect(() => () => {
    stopScanner();
  }, [stopScanner]);

  const selectedProduct = products.find((p) => p.code === form.materialNo);
  const selectedWarehouse = warehouses.find((w) => w.code === form.warehouseId);
  const sourceWarehouse = warehouses.find((w) => w.code === form.sourceWarehouseId);
  const destWarehouse = warehouses.find((w) => w.code === form.destWarehouseId);
  const activeAction = ACTIONS.find((a) => a.id === form.action) ?? ACTIONS[0];
  const qty = Number(form.quantity) || 0;

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.code?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }, [products, productFilter]);

  const primaryDetail = form.action === "transfer" ? destDetail : stockDetail;
  const previewQty = useMemo(() => {
    if (form.action === "transfer") {
      const sourceQty = sourceDetail?.quantity;
      const destQty = destDetail?.quantity;
      return {
        sourceAfter: sourceQty == null ? null : Math.max(0, sourceQty - qty),
        destAfter: destQty == null ? null : destQty + qty,
      };
    }
    if (stockDetail?.quantity == null) return { after: null };
    if (form.action === "in") return { after: stockDetail.quantity + qty };
    return { after: Math.max(0, stockDetail.quantity - qty) };
  }, [form.action, stockDetail, sourceDetail, destDetail, qty]);

  const loadDetails = useCallback(
    async ({ silent = false, preferResult = null } = {}) => {
      const requestId = ++detailRequestRef.current;
      const matnr = form.materialNo?.trim();
      if (!matnr) {
        setStockDetail(null);
        setSourceDetail(null);
        setDestDetail(null);
        setRelatedStocks([]);
        return;
      }

      if (preferResult) {
        if (form.action === "transfer") {
          setDestDetail(preferResult);
        } else {
          setStockDetail(preferResult);
        }
      }

      if (!silent) setDetailLoading(true);
      try {
        if (form.action === "transfer") {
          const [source, dest, related] = await Promise.all([
            form.sourceWarehouseId
              ? fetchStockDetail(matnr, form.sourceWarehouseId).catch(() => null)
              : Promise.resolve(null),
            form.destWarehouseId
              ? fetchStockDetail(matnr, form.destWarehouseId).catch(() => null)
              : Promise.resolve(null),
            fetchStocks({ materialNo: matnr }).catch(() => []),
          ]);
          if (requestId !== detailRequestRef.current) return;
          setSourceDetail(source);
          setDestDetail(dest);
          setStockDetail(dest);
          setRelatedStocks(related.slice(0, 6));
        } else {
          const whId = form.warehouseId;
          const [detail, related] = await Promise.all([
            whId ? fetchStockDetail(matnr, whId).catch(() => null) : Promise.resolve(null),
            fetchStocks({ materialNo: matnr }).catch(() => []),
          ]);
          if (requestId !== detailRequestRef.current) return;
          setStockDetail(detail);
          setSourceDetail(null);
          setDestDetail(null);
          setRelatedStocks(related.slice(0, 6));
        }
      } catch (error) {
        if (!silent) setMessage({ type: "error", text: error.message });
      } finally {
        if (requestId === detailRequestRef.current) setDetailLoading(false);
      }
    },
    [form.action, form.materialNo, form.warehouseId, form.sourceWarehouseId, form.destWarehouseId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDetails({ silent: true });
    }, 280);
    return () => clearTimeout(timer);
  }, [loadDetails]);

  useStockHub((payload) => {
    const matnr = payload?.materialNo ?? payload?.matnr;
    const whId = payload?.warehouseId ?? payload?.whId;
    if (!matnr || matnr !== form.materialNo) return;

    const qtyValue = Number(payload?.quantity ?? 0);
    const next = {
      materialNo: matnr,
      warehouseId: whId ?? "",
      quantity: qtyValue,
      updatedAt: payload?.updatedAt ?? new Date().toISOString(),
    };

    if (form.action === "transfer") {
      if (whId === form.sourceWarehouseId) setSourceDetail(next);
      if (whId === form.destWarehouseId) {
        setDestDetail(next);
        setStockDetail(next);
      }
    } else if (!whId || whId === form.warehouseId) {
      setStockDetail(next);
    }

    setRelatedStocks((current) => {
      const without = current.filter(
        (row) => !(row.materialNo === matnr && row.warehouseId === whId),
      );
      return [next, ...without].slice(0, 6);
    });
  });

  const pushHistory = (entry) => {
    setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.materialNo) {
      setMessage({ type: "error", text: "Malzeme seçin." });
      return;
    }
    if (form.action === "transfer" && form.sourceWarehouseId === form.destWarehouseId) {
      setMessage({ type: "error", text: "Kaynak ve hedef depo farklı olmalı." });
      return;
    }
    if (form.action === "out" && stockDetail && qty > stockDetail.quantity) {
      setMessage({
        type: "error",
        text: `Yetersiz stok. Mevcut: ${stockDetail.quantity}, istenen: ${qty}.`,
      });
      return;
    }
    if (form.action === "transfer" && sourceDetail && qty > sourceDetail.quantity) {
      setMessage({
        type: "error",
        text: `Kaynak depoda yetersiz stok. Mevcut: ${sourceDetail.quantity}, istenen: ${qty}.`,
      });
      return;
    }

    setBusy(true);
    const beforeQty =
      form.action === "transfer" ? sourceDetail?.quantity : stockDetail?.quantity;

    try {
      let result;
      if (form.action === "in") result = await stockIn(form);
      else if (form.action === "out") result = await stockOut(form);
      else result = await transferStock(form);

      pushHistory({
        id: `${Date.now()}-${form.action}`,
        at: new Date().toISOString(),
        action: form.action,
        materialNo: form.materialNo,
        materialName: selectedProduct?.name ?? "",
        warehouseId:
          form.action === "transfer"
            ? `${form.sourceWarehouseId} → ${form.destWarehouseId}`
            : form.warehouseId,
        quantity: qty,
        beforeQty: beforeQty ?? null,
        afterQty: result?.quantity ?? null,
        refNo: form.refNo?.trim() || "",
      });

      setMessage({
        type: "success",
        text: `${actionLabel(form.action)} tamamlandı · güncel miktar ${result?.quantity ?? "—"}.`,
      });

      await loadDetails({ silent: true, preferResult: result });
      invalidateCaches();
      setForm((current) => ({ ...current, quantity: "1", refNo: "" }));
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const applyHistory = (entry) => {
    const [source, dest] = entry.warehouseId.includes("→")
      ? entry.warehouseId.split("→").map((part) => part.trim())
      : [entry.warehouseId, form.destWarehouseId];

    setForm((current) => ({
      ...current,
      action: entry.action,
      materialNo: entry.materialNo,
      warehouseId: entry.action === "transfer" ? current.warehouseId : source,
      sourceWarehouseId: entry.action === "transfer" ? source : current.sourceWarehouseId,
      destWarehouseId: entry.action === "transfer" ? dest : current.destWarehouseId,
      quantity: String(entry.quantity || 1),
      refNo: entry.refNo || "",
    }));
    setMessage({ type: "success", text: "Önceki işlem forma yüklendi." });
  };

  const clearForm = () => {
    setForm((current) => ({
      ...emptyForm,
      action: current.action,
      warehouseId: warehouses[0]?.code ?? "",
      sourceWarehouseId: warehouses[0]?.code ?? "",
      destWarehouseId: warehouses[1]?.code ?? warehouses[0]?.code ?? "",
    }));
    setProductFilter("");
    setStockDetail(null);
    setSourceDetail(null);
    setDestDetail(null);
    setRelatedStocks([]);
  };

  return (
    <div className="page operations-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Depo operasyonu</span>
          <h1>Hızlı Stok İşlemleri</h1>
          <p>Barkod, hızlı miktar ve canlı SAP stok detayı ile giriş/çıkış/transfer yapın.</p>
        </div>
        <div className="ops-header-actions">
          <Link className="btn btn-secondary" to="/movements">
            Hareketler
          </Link>
          <Link className="btn btn-secondary" to="/stocks">
            Stok listesi
          </Link>
        </div>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <div className="operations-shell">
        <section className="operations-panel">
          <div className="operations-panel-head">
            <div>
              <span className="eyebrow">{activeAction.label}</span>
              <h2>İşlem formu</h2>
              <p>{activeAction.hint}</p>
            </div>
            <div className="ops-head-buttons">
              <Button type="button" onClick={clearForm}>
                Temizle
              </Button>
              <Button
                className={scanning ? "ops-scan-btn is-active" : "ops-scan-btn"}
                onClick={scanning ? stopScanner : startScanner}
              >
                {scanning ? "Taramayı Durdur" : "Barkod Tara"}
              </Button>
            </div>
          </div>

          <div className="ops-action-tabs" role="tablist" aria-label="Stok işlem tipi">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                role="tab"
                aria-selected={form.action === action.id}
                className={form.action === action.id ? `ops-tab is-active tone-${action.tone}` : "ops-tab"}
                onClick={() => setForm({ ...form, action: action.id })}
              >
                <strong>{action.label}</strong>
                <span>{action.hint}</span>
              </button>
            ))}
          </div>

          {scanning && (
            <div className="ops-scanner">
              <div id={scannerId} className="ops-scanner-viewport" />
              <p>Barkodu çerçeveye hizalayın; okununca malzeme alanı otomatik dolar.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="ops-form">
            <div className="ops-form-grid">
              <div className="ops-span-2">
                <TextInput
                  label="Malzeme ara"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  placeholder="Kod, ad veya barkod"
                />
              </div>

              <SelectInput
                label="Malzeme"
                value={form.materialNo}
                onChange={(e) => setForm({ ...form, materialNo: e.target.value })}
                required
              >
                <option value="">Seçin</option>
                {filteredProducts.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} — {p.name}
                    {p.unit ? ` (${p.unit})` : ""}
                  </option>
                ))}
              </SelectInput>

              {form.action !== "transfer" ? (
                <SelectInput
                  label="Depo"
                  value={form.warehouseId}
                  onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} — {w.name}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <>
                  <SelectInput
                    label="Kaynak depo"
                    value={form.sourceWarehouseId}
                    onChange={(e) => setForm({ ...form, sourceWarehouseId: e.target.value })}
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} — {w.name}
                      </option>
                    ))}
                  </SelectInput>
                  <SelectInput
                    label="Hedef depo"
                    value={form.destWarehouseId}
                    onChange={(e) => setForm({ ...form, destWarehouseId: e.target.value })}
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={`dest-${w.code}`} value={w.code}>
                        {w.code} — {w.name}
                      </option>
                    ))}
                  </SelectInput>
                </>
              )}

              <div className="ops-qty-field">
                <TextInput
                  label="Miktar"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
                <div className="ops-qty-presets">
                  {QTY_PRESETS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={Number(form.quantity) === value ? "ops-chip is-active" : "ops-chip"}
                      onClick={() => setForm({ ...form, quantity: String(value) })}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <TextInput
                label="Referans no"
                value={form.refNo}
                onChange={(e) => setForm({ ...form, refNo: e.target.value })}
                placeholder="Opsiyonel belge / iş emri"
              />
            </div>

            <div className="ops-form-footer">
              <div className="ops-summary">
                <span className="eyebrow">Özet</span>
                <p>
                  {selectedProduct ? `${selectedProduct.code} · ${selectedProduct.name}` : "Malzeme seçilmedi"}
                  {" · "}
                  {form.action === "transfer"
                    ? `${form.sourceWarehouseId || "?"} → ${form.destWarehouseId || "?"}`
                    : selectedWarehouse
                      ? `${selectedWarehouse.code} · ${selectedWarehouse.name}`
                      : "Depo seçilmedi"}
                  {" · "}
                  {qty} {selectedProduct?.unit || "adet"}
                </p>
                {form.action !== "transfer" && previewQty.after != null && (
                  <p className="ops-preview">
                    Mevcut {stockDetail.quantity} → işlem sonrası <strong>{previewQty.after}</strong>
                  </p>
                )}
                {form.action === "transfer" &&
                  previewQty.sourceAfter != null &&
                  previewQty.destAfter != null && (
                  <p className="ops-preview">
                    Kaynak {sourceDetail.quantity} → {previewQty.sourceAfter}
                    {" · "}
                    Hedef {destDetail.quantity} → {previewQty.destAfter}
                  </p>
                )}
              </div>
              <div className="ops-actions">
                <Button
                  type="button"
                  onClick={() => loadDetails({ silent: false })}
                  disabled={!form.materialNo || detailLoading}
                >
                  {detailLoading ? "Yenileniyor..." : "Yenile"}
                </Button>
                <Button variant="primary" type="submit" disabled={busy || !form.materialNo}>
                  {busy ? "İşleniyor..." : `${activeAction.label} kaydet`}
                </Button>
              </div>
            </div>
          </form>

          <section className="ops-history">
            <div className="ops-history-head">
              <span className="eyebrow">Bu oturum</span>
              <h3>Son işlemler</h3>
            </div>
            {history.length === 0 ? (
              <p className="ops-empty">Henüz bu oturumda işlem yok. Kaydettiğiniz hareketler burada listelenir.</p>
            ) : (
              <ul className="ops-history-list">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <button type="button" onClick={() => applyHistory(entry)}>
                      <span className={`ops-history-badge tone-${entry.action}`}>{actionLabel(entry.action)}</span>
                      <div>
                        <strong>
                          {entry.materialNo}
                          {entry.materialName ? ` · ${entry.materialName}` : ""}
                        </strong>
                        <p>
                          {entry.warehouseId} · {entry.quantity}
                          {entry.afterQty != null ? ` → ${entry.afterQty}` : ""}
                          {entry.refNo ? ` · ref ${entry.refNo}` : ""}
                        </p>
                      </div>
                      <time>{formatTime(entry.at)}</time>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <aside className="operations-aside">
          {form.action === "transfer" ? (
            <>
              <article className={`ops-aside-card ${sourceDetail ? "has-detail" : ""}`}>
                <span className="eyebrow">Kaynak stok</span>
                {sourceDetail ? (
                  <>
                    <h3>
                      {sourceDetail.materialNo}
                      <span>@{sourceDetail.warehouseId}</span>
                    </h3>
                    <p className="ops-qty">{sourceDetail.quantity}</p>
                    <p className="ops-aside-meta">
                      {sourceWarehouse?.name || form.sourceWarehouseId}
                      {formatTime(sourceDetail.updatedAt) ? ` · ${formatTime(sourceDetail.updatedAt)}` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>{detailLoading ? "Yükleniyor..." : "Kaynak bekleniyor"}</h3>
                    <p>Malzeme ve kaynak depo seçildiğinde otomatik gelir.</p>
                  </>
                )}
              </article>

              <article className={`ops-aside-card ${destDetail ? "has-detail" : ""}`}>
                <span className="eyebrow">Hedef stok</span>
                {destDetail ? (
                  <>
                    <h3>
                      {destDetail.materialNo}
                      <span>@{destDetail.warehouseId}</span>
                    </h3>
                    <p className="ops-qty">{destDetail.quantity}</p>
                    <p className="ops-aside-meta">
                      {destWarehouse?.name || form.destWarehouseId}
                      {formatTime(destDetail.updatedAt) ? ` · ${formatTime(destDetail.updatedAt)}` : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <h3>{detailLoading ? "Yükleniyor..." : "Hedef bekleniyor"}</h3>
                    <p>Malzeme ve hedef depo seçildiğinde otomatik gelir.</p>
                  </>
                )}
              </article>
            </>
          ) : (
            <article className={`ops-aside-card ${primaryDetail ? "has-detail" : ""}`}>
              <div className="ops-aside-top">
                <span className="eyebrow">Stok detayı</span>
                {detailLoading && <span className="ops-live-dot">Canlı</span>}
              </div>
              {primaryDetail ? (
                <>
                  <h3>
                    {primaryDetail.materialNo}
                    <span>@{primaryDetail.warehouseId}</span>
                  </h3>
                  <p className="ops-qty">{primaryDetail.quantity}</p>
                  <p className="ops-aside-meta">
                    Güncel miktar SAP’den okundu
                    {formatTime(primaryDetail.updatedAt) ? ` · ${formatTime(primaryDetail.updatedAt)}` : ""}.
                  </p>
                  {selectedProduct && (
                    <p className="ops-aside-meta">
                      {selectedProduct.name}
                      {selectedProduct.unit ? ` · ${selectedProduct.unit}` : ""}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3>{detailLoading ? "SAP’den okunuyor..." : "Henüz sorgu yok"}</h3>
                  <p>Malzeme ve depo seçince stok detayı otomatik gelir; kayıttan sonra da güncellenir.</p>
                </>
              )}
            </article>
          )}

          <article className="ops-aside-card">
            <span className="eyebrow">Diğer depolar</span>
            <h3>Aynı malzeme</h3>
            {relatedStocks.length === 0 ? (
              <p>Malzeme seçildiğinde diğer depolardaki miktarlar listelenir.</p>
            ) : (
              <ul className="ops-related-list">
                {relatedStocks.map((row) => (
                  <li key={`${row.materialNo}-${row.warehouseId}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) =>
                          current.action === "transfer"
                            ? { ...current, sourceWarehouseId: row.warehouseId }
                            : { ...current, warehouseId: row.warehouseId },
                        )
                      }
                    >
                      <strong>{row.warehouseId}</strong>
                      <span>{row.quantity}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="ops-aside-card ops-tip">
            <span className="eyebrow">Kısayollar</span>
            <p>
              Barkod tara → miktar chip’i seç → Kaydet. Kayıt sonrası stok kartı otomatik yenilenir.
              Depo kodunu kısa tutun (<code>D001</code>, <code>W001</code>).
            </p>
          </article>
        </aside>
      </div>
    </div>
  );
}

export default Operations;
