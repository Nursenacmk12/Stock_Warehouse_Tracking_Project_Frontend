import { useCallback, useMemo, useState } from "react";
import {
  getCategories,
  getMovements,
  getProducts,
  setMovements,
  setProducts,
} from "../data/mockData";
import "./Products.css";

const icons = {
  plus: (
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
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="m19 6-.8 14.2A2 2 0 0 1 16.2 22H7.8a2 2 0 0 1-2-1.8L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 15 7-7 7 7" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m19 9-7 7-7-7" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" />
      <path d="M4 7l8 4 8-4" />
      <path d="M12 11v10" />
    </svg>
  ),
};

const initialFormData = { name: "", category: "", stock: "", minStock: "" };

function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [formErrors, setFormErrors] = useState({});
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockAction, setStockAction] = useState(null);
  const [stockAmount, setStockAmount] = useState("1");
  const [stockError, setStockError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [, setRefresh] = useState(0);

  const products = getProducts();
  const categories = getCategories();

  const refreshPage = useCallback(() => {
    setRefresh((r) => r + 1);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);
      const matchesCategory = !filterCategory || product.category === filterCategory;
      const isLow = product.stock < product.minStock;
      const matchesStatus =
        !filterStatus ||
        (filterStatus === "critical" && isLow) ||
        (filterStatus === "normal" && !isLow);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [filterCategory, filterStatus, products, searchTerm]);

  const hasActiveFilters = Boolean(searchTerm || filterCategory || filterStatus);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterStatus("");
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        stock: String(product.stock),
        minStock: String(product.minStock),
      });
    } else {
      setEditingProduct(null);
      setFormData({ ...initialFormData, category: categories[0]?.name || "" });
    }

    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const stock = Number(formData.stock);
    const minStock = Number(formData.minStock);

    if (!formData.name.trim()) errors.name = "Ürün adı zorunludur.";
    if (!formData.category) errors.category = "Kategori seçimi zorunludur.";
    if (formData.stock === "" || Number.isNaN(stock) || stock < 0) {
      errors.stock = "Stok 0 veya daha büyük olmalıdır.";
    }
    if (formData.minStock === "" || Number.isNaN(minStock) || minStock < 0) {
      errors.minStock = "Minimum stok 0 veya daha büyük olmalıdır.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addMovement = ({ productId, productName, type, amount, description }) => {
    const movements = getMovements();
    const newId = Math.max(0, ...movements.map((movement) => movement.id || 0)) + 1;
    const newMovement = {
      id: newId,
      productId,
      productName,
      type,
      amount,
      description,
      date: new Date().toISOString(),
    };

    setMovements([newMovement, ...movements]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const currentProducts = getProducts();
    const cleanedName = formData.name.trim();
    const payload = {
      name: cleanedName,
      category: formData.category,
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
    };

    if (editingProduct) {
      const newProducts = currentProducts.map((product) =>
        product.id === editingProduct.id ? { ...product, ...payload } : product,
      );

      setProducts(newProducts);
      addMovement({
        productId: editingProduct.id,
        productName: cleanedName,
        type: "edit",
        amount: 0,
        description: `${cleanedName} bilgileri güncellendi`,
      });
    } else {
      const newId = Math.max(0, ...currentProducts.map((product) => product.id)) + 1;
      const newProduct = { id: newId, ...payload };

      setProducts([...currentProducts, newProduct]);
      addMovement({
        productId: newId,
        productName: cleanedName,
        type: "add",
        amount: payload.stock,
        description: `${cleanedName} ürünü eklendi`,
      });
    }

    refreshPage();
    closeModal();
  };

  const handleDelete = (product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      return;
    }

    const newProducts = getProducts().filter((item) => item.id !== product.id);
    setProducts(newProducts);
    addMovement({
      productId: product.id,
      productName: product.name,
      type: "delete",
      amount: product.stock,
      description: `${product.name} ürünü silindi`,
    });
    refreshPage();
  };

  const openStockModal = (product, action) => {
    setSelectedProduct(product);
    setStockAction(action);
    setStockAmount("1");
    setStockError("");
    setShowStockModal(true);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setSelectedProduct(null);
    setStockAction(null);
    setStockAmount("1");
    setStockError("");
  };

  const handleStockChange = () => {
    if (!selectedProduct) return;

    const amount = Number(stockAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStockError("Miktar 1 veya daha büyük olmalıdır.");
      return;
    }

    const newProducts = getProducts().map((product) => {
      if (product.id !== selectedProduct.id) return product;

      const newStock =
        stockAction === "increase"
          ? product.stock + amount
          : Math.max(0, product.stock - amount);

      return { ...product, stock: newStock };
    });

    setProducts(newProducts);
    addMovement({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      type: stockAction,
      amount,
      description:
        stockAction === "increase"
          ? `${selectedProduct.name} stoğu artırıldı (+${amount})`
          : `${selectedProduct.name} stoğu azaltıldı (-${amount})`,
    });
    refreshPage();
    closeStockModal();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Stok kataloğu</span>
          <h1>Ürünler</h1>
          <p>Ürünlerinizi arayın, filtreleyin ve stok seviyelerini hızlıca güncelleyin.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} type="button">
          <span className="btn-icon">{icons.plus}</span>
          Yeni Ürün Ekle
        </button>
      </div>

      <div className="filters products-toolbar">
        <div className="search-box">
          {icons.search}
          <input
            type="text"
            placeholder="Ürün veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Tüm Kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="critical">Kritik Stok</option>
          <option value="normal">Normal Stok</option>
        </select>
        {hasActiveFilters && (
          <button className="btn btn-secondary" onClick={clearFilters} type="button">
            Temizle
          </button>
        )}
      </div>

      <div className="card">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            {icons.empty}
            <div>
              <strong>Ürün bulunamadı</strong>
              <p>
                {hasActiveFilters
                  ? "Filtrelerinize uygun ürün yok. Filtreleri temizleyerek tekrar deneyin."
                  : "İlk ürününüzü ekleyerek stok takibine başlayabilirsiniz."}
              </p>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-secondary" onClick={clearFilters} type="button">
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table products-table">
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Min. Stok</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isCritical = product.stock < product.minStock;

                  return (
                    <tr key={product.id} className={isCritical ? "danger-row" : ""}>
                      <td>
                        <div className="product-cell">
                          <strong>{product.name}</strong>
                          <span>Ürün No: {product.id}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-chip">{product.category}</span>
                      </td>
                      <td className="numeric-cell">{product.stock}</td>
                      <td className="numeric-cell muted-text">{product.minStock}</td>
                      <td>
                        <span className={`badge ${isCritical ? "danger" : "success"}`}>
                          {isCritical ? "Kritik" : "Normal"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon-only success"
                            onClick={() => openStockModal(product, "increase")}
                            title="Stok artır"
                            aria-label={`${product.name} stok artır`}
                            type="button"
                          >
                            {icons.up}
                          </button>
                          <button
                            className="btn-icon-only warning"
                            onClick={() => openStockModal(product, "decrease")}
                            title="Stok azalt"
                            aria-label={`${product.name} stok azalt`}
                            type="button"
                          >
                            {icons.down}
                          </button>
                          <button
                            className="btn-icon-only"
                            onClick={() => openModal(product)}
                            title="Düzenle"
                            aria-label={`${product.name} düzenle`}
                            type="button"
                          >
                            {icons.edit}
                          </button>
                          <button
                            className="btn-icon-only danger"
                            onClick={() => handleDelete(product)}
                            title="Sil"
                            aria-label={`${product.name} sil`}
                            type="button"
                          >
                            {icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">{editingProduct ? "Ürün bilgisi" : "Yeni kayıt"}</span>
                <h2>{editingProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</h2>
              </div>
              <button
                className="btn-icon-only"
                onClick={closeModal}
                aria-label="Pencereyi kapat"
                type="button"
              >
                {icons.close}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="productName">Ürün adı</label>
                <input
                  id="productName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? "error" : ""}
                  autoFocus
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="productCategory">Kategori</label>
                <select
                  id="productCategory"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={formErrors.category ? "error" : ""}
                >
                  <option value="">Seçiniz</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.category && <span className="error-text">{formErrors.category}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="productStock">Stok</label>
                  <input
                    id="productStock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className={formErrors.stock ? "error" : ""}
                  />
                  {formErrors.stock && <span className="error-text">{formErrors.stock}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="productMinStock">Minimum stok</label>
                  <input
                    id="productMinStock"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    className={formErrors.minStock ? "error" : ""}
                  />
                  {formErrors.minStock && <span className="error-text">{formErrors.minStock}</span>}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Kaydet" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeStockModal()}
        >
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Stok işlemi</span>
                <h2>Stok {stockAction === "increase" ? "Artır" : "Azalt"}</h2>
              </div>
              <button
                className="btn-icon-only"
                onClick={closeStockModal}
                aria-label="Pencereyi kapat"
                type="button"
              >
                {icons.close}
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Ürün</label>
                <p className="product-name">{selectedProduct?.name}</p>
              </div>
              <div className="form-group">
                <label htmlFor="stockAmount">Miktar</label>
                <input
                  id="stockAmount"
                  type="number"
                  min="1"
                  value={stockAmount}
                  onChange={(e) => {
                    setStockAmount(e.target.value);
                    setStockError("");
                  }}
                  className={stockError ? "error" : ""}
                  autoFocus
                />
                {stockError && <span className="error-text">{stockError}</span>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeStockModal}>
                  İptal
                </button>
                <button
                  type="button"
                  className={`btn ${stockAction === "increase" ? "btn-success" : "btn-danger"}`}
                  onClick={handleStockChange}
                >
                  {stockAction === "increase" ? "Artır" : "Azalt"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
