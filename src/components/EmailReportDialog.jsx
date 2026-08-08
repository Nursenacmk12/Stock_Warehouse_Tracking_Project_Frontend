import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, TextInput } from "./ui/CommonUI.jsx";
import { emailReport } from "../services/reportApi.js";

export default function EmailReportDialog({ onClose, onDone, defaultEmail = "" }) {
  const [to, setTo] = useState(defaultEmail);
  const [periodDays, setPeriodDays] = useState(7);
  const [includeCsv, setIncludeCsv] = useState(true);
  const [provider, setProvider] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await emailReport({
        to: to.trim() || null,
        periodDays,
        includeCsv,
        provider: provider === "auto" ? null : provider,
      });
      onDone?.(result);
      onClose?.();
    } catch (err) {
      setError(err.message || "E-posta gönderilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Raporu e-posta ile gönder" onClose={onClose}>
      <div className="modal-body" style={{ display: "grid", gap: 14 }}>
        <TextInput
          label="Alıcı e-posta (boş bırakılırsa tercih/ayar kullanılır)"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="ornek@firma.com"
        />
        <TextInput
          label="Dönem (gün)"
          type="number"
          min={1}
          max={90}
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value) || 7)}
        />
        <label className="form-group">
          <span>Gönderim sağlayıcısı</span>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="auto">Otomatik (SMTP tercih, yoksa SendGrid)</option>
            <option value="Smtp">SMTP</option>
            <option value="SendGrid">SendGrid</option>
          </select>
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={includeCsv} onChange={(e) => setIncludeCsv(e.target.checked)} />
          CSV ekini dahil et
        </label>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
          SMTP sunucu ayarlarını <Link to="/settings">Ayarlar</Link> sayfasından yapılandırabilirsiniz.
        </p>
        {error && <span className="field-error">{error}</span>}
        <div className="modal-footer">
          <Button onClick={onClose} disabled={busy}>
            Vazgeç
          </Button>
          <Button variant="primary" onClick={handleSend} disabled={busy}>
            {busy ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
