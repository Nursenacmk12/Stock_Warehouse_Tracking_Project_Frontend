import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Lightweight Cmd/Ctrl+K quick navigation palette.
 * items: [{ path, label, group? }]
 */
export default function CommandPalette({ open, onClose, items, onNavigate }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(term) ||
        item.path.toLowerCase().includes(term) ||
        item.group?.toLowerCase().includes(term),
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const select = (item) => {
    if (!item) return;
    onNavigate(item.path);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      select(filtered[active]);
    }
  };

  return (
    <div className="cmdk-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="cmdk-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Hızlı gezinme"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          className="cmdk-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sayfa ara… (ör. stok, rapor)"
          aria-label="Sayfa ara"
        />
        <ul className="cmdk-list" role="listbox">
          {filtered.length === 0 ? (
            <li className="cmdk-empty">Sonuç yok</li>
          ) : (
            filtered.map((item, index) => (
              <li key={item.path}>
                <button
                  type="button"
                  className={`cmdk-item${index === active ? " active" : ""}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(item)}
                >
                  <span>{item.label}</span>
                  <small>{item.group || item.path}</small>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="cmdk-hint">
          <span>↑↓ Gezin</span>
          <span>Enter Aç</span>
          <span>Esc Kapat</span>
        </div>
      </div>
    </div>
  );
}
