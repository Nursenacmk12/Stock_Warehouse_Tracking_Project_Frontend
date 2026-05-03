import { useMemo, useState } from "react";
import { getMovements } from "../data/mockData";
import "./Movements.css";

const typeLabels = {
  add: "Ekleme",
  edit: "Düzenleme",
  delete: "Silme",
  increase: "Stok Artırma",
  decrease: "Stok Azaltma",
};

const typeIcons = {
  add: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4v16m8-8H4" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </svg>
  ),
  delete: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="m19 6-.8 14.2A2 2 0 0 1 16.2 22H7.8a2 2 0 0 1-2-1.8L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),
  increase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 15 7-7 7 7" />
    </svg>
  ),
  decrease: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m19 9-7 7-7-7" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4" />
      <path d="M14 3h7v7" />
      <path d="m10 14 11-11" />
    </svg>
  ),
};

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Movements() {
  const [filterType, setFilterType] = useState("");

  const filteredMovements = useMemo(() => {
    const movements = getMovements();
    if (!filterType) return movements;
    return movements.filter((movement) => movement.type === filterType);
  }, [filterType]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">İşlem geçmişi</span>
          <h1>Stok Hareketleri</h1>
          <p>Ürün ekleme, düzenleme, silme ve stok değişikliklerini kronolojik olarak izleyin.</p>
        </div>
      </div>

      <div className="filters">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Tüm İşlemler</option>
          <option value="add">Ekleme</option>
          <option value="increase">Stok Artırma</option>
          <option value="decrease">Stok Azaltma</option>
          <option value="edit">Düzenleme</option>
          <option value="delete">Silme</option>
        </select>
      </div>

      <div className="card">
        {filteredMovements.length === 0 ? (
          <div className="empty-state">
            {typeIcons.empty}
            <div>
              <strong>Stok hareketi bulunmuyor</strong>
              <p>Ürün eklediğinizde veya stok güncellediğinizde kayıtlar burada görünür.</p>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table movements-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>İşlem Türü</th>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="date-cell">{formatDate(movement.date)}</td>
                    <td>
                      <span className={`type-badge ${movement.type}`}>
                        <span className="type-icon">{typeIcons[movement.type]}</span>
                        {typeLabels[movement.type] || "Bilinmeyen"}
                      </span>
                    </td>
                    <td className="product-title">{movement.productName || "-"}</td>
                    <td className="numeric-cell">{movement.amount > 0 ? movement.amount : "-"}</td>
                    <td className="description-cell">{movement.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Movements;
