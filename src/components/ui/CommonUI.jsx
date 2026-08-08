import { useEffect } from "react";
import "./ui.css";

const emptyStateIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M4 7h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
    <path d="M9 7V5a3 3 0 016 0v2" />
    <path d="M9 13h6" />
  </svg>
);

const kpiIcons = {
  blue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  green: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  amber: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M9 21v-7h6v7" />
      <path d="M7 10h10" />
    </svg>
  ),
  red: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
};

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
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

export function FilterBar({ children, secondary, actions, className = "" }) {
  return (
    <div className={`filters operation-filters list-filters ${className}`.trim()}>
      <div className="filter-primary">{children}</div>
      {secondary ? <div className="filter-secondary">{secondary}</div> : null}
      {actions ? <div className="filter-actions">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ tone = "neutral", children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function EmptyState({ title, text, action, icon, className = "" }) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state-icon">{icon ?? emptyStateIcon}</div>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action ? <div className="empty-state-action">{action}</div> : null}
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

export function Toast({ message, onDismiss, autoHideMs = 4000 }) {
  useEffect(() => {
    if (!message?.text || !onDismiss) return undefined;
    const timer = window.setTimeout(onDismiss, autoHideMs);
    return () => window.clearTimeout(timer);
  }, [message?.text, onDismiss, autoHideMs]);

  if (!message?.text) return null;
  return (
    <div className={`message ${message.type || "success"}`} role="status">
      {message.text}
    </div>
  );
}

export function KpiCard({ label, value, tone = "blue", helper, icon }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${tone}`}>{icon ?? kpiIcons[tone] ?? kpiIcons.blue}</div>
      <div>
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
        {helper && <small className="kpi-helper">{helper}</small>}
      </div>
    </article>
  );
}
