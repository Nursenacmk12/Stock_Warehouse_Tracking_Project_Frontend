import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { Button, SelectInput, TextInput, Toast } from "../components/ui/CommonUI.jsx";
import { stockIn, stockOut, transferStock, fetchStockDetail } from "../services/stockApi.js";
import { useProducts, useWarehouses } from "../hooks/useQueries.js";
import { queryKeys } from "../lib/queryClient.js";
import "./Movements.css";

const emptyForm = {
  action: "in",
  materialNo: "",
  warehouseId: "",
  sourceWarehouseId: "",
  destWarehouseId: "",
  quantity: "1",
  refNo: "",
};

function Operations() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [stockDetail, setStockDetail] = useState(null);
  const scannerRef = useRef(null);
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

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stocks({}) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary });
    queryClient.invalidateQueries({ queryKey: queryKeys.lowStockAlerts });
  };

  const stopScanner = async () => {
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
  };

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
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (form.action === "in") {
        await stockIn(form);
      } else if (form.action === "out") {
        await stockOut(form);
      } else {
        await transferStock(form);
      }
      setMessage({ type: "success", text: "Stok işlemi tamamlandı." });
      invalidateCaches();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const loadDetail = async () => {
    if (!form.materialNo || !form.warehouseId) return;
    try {
      const detail = await fetchStockDetail(form.materialNo, form.warehouseId);
      setStockDetail(detail);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  return (
    <div className="page operations-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Depo operasyonu</span>
          <h1>Hızlı Stok İşlemleri</h1>
          <p>Barkod okutarak veya manuel girerek stok giriş/çıkış/transfer yapın.</p>
        </div>
      </div>

      <Toast message={message} onDismiss={() => setMessage({ type: "", text: "" })} />

      <div className="card">
        <div className="operation-actions" style={{ marginBottom: 16 }}>
          <Button variant={form.action === "in" ? "primary" : "secondary"} onClick={() => setForm({ ...form, action: "in" })}>
            Giriş
          </Button>
          <Button variant={form.action === "out" ? "primary" : "secondary"} onClick={() => setForm({ ...form, action: "out" })}>
            Çıkış
          </Button>
          <Button variant={form.action === "transfer" ? "primary" : "secondary"} onClick={() => setForm({ ...form, action: "transfer" })}>
            Transfer
          </Button>
          <Button onClick={scanning ? stopScanner : startScanner}>{scanning ? "Taramayı Durdur" : "Barkod Tara"}</Button>
        </div>

        {scanning && <div id={scannerId} style={{ width: "100%", maxWidth: 420, marginBottom: 16 }} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <SelectInput
            label="Malzeme"
            value={form.materialNo}
            onChange={(e) => setForm({ ...form, materialNo: e.target.value })}
          >
            <option value="">Seçin</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} — {p.name}
              </option>
            ))}
          </SelectInput>

          {form.action !== "transfer" ? (
            <SelectInput
              label="Depo"
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            >
              {warehouses.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </SelectInput>
          ) : (
            <>
              <SelectInput
                label="Kaynak depo"
                value={form.sourceWarehouseId}
                onChange={(e) => setForm({ ...form, sourceWarehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </SelectInput>
              <SelectInput
                label="Hedef depo"
                value={form.destWarehouseId}
                onChange={(e) => setForm({ ...form, destWarehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </SelectInput>
            </>
          )}

          <TextInput
            label="Miktar"
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <TextInput
            label="Referans no"
            value={form.refNo}
            onChange={(e) => setForm({ ...form, refNo: e.target.value })}
          />

          <div className="operation-actions">
            <Button variant="primary" type="submit" disabled={busy}>
              {busy ? "İşleniyor..." : "Kaydet"}
            </Button>
            <Button type="button" onClick={loadDetail}>
              Stok detayı
            </Button>
          </div>
        </form>

        {stockDetail && (
          <div className="panel-card" style={{ marginTop: 16 }}>
            <span className="eyebrow">Stok detayı</span>
            <p>
              {stockDetail.materialNo} @ {stockDetail.warehouseId}: <strong>{stockDetail.quantity}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Operations;
