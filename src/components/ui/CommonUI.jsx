import "./ui.css";

export function Button({ children, variant = "secondary", className = "", ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} type="button" {...props}>
      {children}
    </button>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function TextInput({ label, error, ...props }) {
  return (
    <Field label={label} error={error}>
      <input className={error ? "input-error" : ""} {...props} />
    </Field>
  );
}

export function SelectInput({ label, error, children, ...props }) {
  return (
    <Field label={label} error={error}>
      <select className={error ? "input-error" : ""} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Modal({ title, children, onClose, size = "" }) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div className={`modal ${size}`.trim()} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon-only" type="button" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Onayla", onConfirm, onCancel, busy }) {
  return (
    <Modal title={title} onClose={onCancel} size="modal-sm">
      <div className="modal-body">
        <p className="confirm-text">{message}</p>
        <div className="modal-footer">
          <Button onClick={onCancel} disabled={busy}>Vazgeç</Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "İşleniyor..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function DataTable({ columns, rows, getRowKey, empty, loading }) {
  if (loading) return <LoadingState text="Veriler yükleniyor..." />;
  if (!rows.length) return empty ?? <EmptyState title="Kayıt bulunamadı" text="Filtreleri değiştirip tekrar deneyin." />;

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={getRowKey ? getRowKey(row) : index}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <span>{totalCount} kayıt</span>
      <div>
        <Button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Önceki</Button>
        <strong>
          {page} / {totalPages}
        </strong>
        <Button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Sonraki</Button>
      </div>
    </div>
  );
}

export function FilterBar({ children }) {
  return <div className="filters operation-filters">{children}</div>;
}

export function StatusBadge({ tone = "neutral", children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ text = "Yükleniyor..." }) {
  return (
    <div className="empty-state">
      <span className="loader-dot" />
      <p>{text}</p>
    </div>
  );
}

export function Toast({ message }) {
  if (!message?.text) return null;
  return (
    <div className={`message ${message.type || "success"}`} role="status">
      {message.text}
    </div>
  );
}

export function KpiCard({ label, value, tone = "blue", helper }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${tone}`} />
      <div>
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
        {helper && <small className="kpi-helper">{helper}</small>}
      </div>
    </article>
  );
}
