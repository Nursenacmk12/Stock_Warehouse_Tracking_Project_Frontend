import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterBar,
  Modal,
  SelectInput,
  StatusBadge,
  TextInput,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "../services/productApi.js";
import { fetchStocks, stockIn, stockOut, transferStock } from "../services/stockApi.js";
import { fetchWarehouses } from "../services/warehouseApi.js";
import { useAuth } from "../context/useAuth.js";
import "./Products.css";

const productEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const emptyProductForm = { code: "", name: "", unit: "ADET", category: "", barcode: "" };
const emptyStockForm = {
  action: "in",
  materialNo: "",
  warehouseId: "",
  sourceWarehouseId: "",
  destWarehouseId: "",
  quantity: "1",
  refNo: "",
};

function hasRole(user, roles) {
  return roles.includes(user?.role);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("tr-TR");
}

function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [formErrors, setFormErrors] = useState({});
  const [stockModal, setStockModal] = useState(null);
  const [stockForm, setStockForm] = useState(emptyStockForm);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const canWriteProducts = hasRole(user, ["SuperAdmin", "Admin", "WarehouseManager"]);
  const canDeleteProducts = hasRole(user, ["SuperAdmin", "Admin"]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextProducts, nextWarehouses, nextStocks] = await Promise.all([
        fetchProducts(),
        fetchWarehouses(),
        fetchStocks(),
      ]);
      setProducts(nextProducts);
      setWarehouses(nextWarehouses);
      setStocks(nextStocks);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const stockByMaterial = useMemo(() => {
    return stocks.reduce((acc, stock) => {
      acc[stock.materialNo] = (acc[stock.materialNo] ?? 0) + stock.quantity;
      return acc;
    }, {});
  }, [stocks]);

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "tr"),
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const totalStock = stockByMaterial[product.code] ?? 0;
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.code.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !category || product.category === category;
      const matchesStatus =
        !status ||
        (status === "sap" && product.isSapOnly) ||
        (status === "local" && !product.isSapOnly) ||
        (status === "in-stock" && totalStock > 0) ||
        (status === "empty" && totalStock <= 0);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, products, query, status, stockByMaterial]);

  const openProductModal = (product = null) => {
    setProductModal(product);
    setFormErrors({});
    setProductForm(
      product
        ? {
            code: product.code,
            name: product.name,
            unit: product.unit,
            category: product.category,
            barcode: product.barcode,
          }
        : emptyProductForm,
    );
  };

  const validateProduct = () => {
    const errors = {};
    if (!productModal && !productForm.code.trim()) errors.code = "Ürün kodu zorunludur.";
    if (!productForm.name.trim()) errors.name = "Ürün adı zorunludur.";
    if (!productForm.unit.trim()) errors.unit = "Birim zorunludur.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    if (!validateProduct()) return;

    setBusy(true);
    try {
      if (productModal) {
        await updateProduct(productModal.id, productForm);
        setMessage({ type: "success", text: "Ürün güncellendi." });
      } else {
        await createProduct(productForm);
        setMessage({ type: "success", text: "Ürün oluşturuldu." });
      }
      setProductModal(false);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    try {
      await deleteProduct(confirmDelete.id);
      setMessage({ type: "success", text: "Ürün silindi." });
      setConfirmDelete(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const openStockModal = (product = null, action = "in") => {
    const firstWarehouse = warehouses[0]?.code ?? "";
    setStockModal(product ?? { name: "Stok İşlemi" });
    setStockForm({
      ...emptyStockForm,
      action,
      materialNo: product?.code ?? "",
      warehouseId: firstWarehouse,
      sourceWarehouseId: firstWarehouse,
      destWarehouseId: warehouses[1]?.code ?? firstWarehouse,
    });
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (stockForm.action === "in") {
        await stockIn(stockForm);
        setMessage({ type: "success", text: "SAP stok girişi tamamlandı." });
      } else if (stockForm.action === "out") {
        await stockOut(stockForm);
        setMessage({ type: "success", text: "SAP stok çıkışı tamamlandı." });
      } else {
        await transferStock(stockForm);
        setMessage({ type: "success", text: "SAP depo transferi tamamlandı." });
      }
      setStockModal(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Ürün",
      render: (product) => (
        <div className="entity-name">
          <strong>{product.name}</strong>
          <span>{product.code || "Kod yok"}</span>
        </div>
      ),
    },
    { key: "category", header: "Kategori", render: (product) => product.category || "-" },
    { key: "unit", header: "Birim" },
    {
      key: "stock",
      header: "Toplam Stok",
      className: "numeric-cell",
      render: (product) => stockByMaterial[product.code] ?? 0,
    },
    {
      key: "source",
      header: "Kaynak",
      render: (product) => (
        <StatusBadge tone={product.isSapOnly ? "warning" : "success"}>
          {product.isSapOnly ? "SAP katalog" : "Yerel kayıt"}
        </StatusBadge>
      ),
    },
    { key: "createdAt", header: "Kayıt", render: (product) => formatDate(product.createdAt) },
    {
      key: "actions",
      header: "İşlemler",
      render: (product) => (
        <div className="operation-actions">
          <Button onClick={() => openStockModal(product, "in")} disabled={!canWriteProducts}>
            Stok
          </Button>
          <Button onClick={() => openProductModal(product)} disabled={!canWriteProducts || product.isSapOnly}>
            Düzenle
          </Button>
          <Button
            variant="danger"
            onClick={() => setConfirmDelete(product)}
            disabled={!canDeleteProducts || product.isSapOnly}
          >
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">SAP ürün kataloğu</span>
          <h1>Ürünler</h1>
          <p>Ürün ana verisini API’den yönetin, SAP stok işlemlerini ürün kodu üzerinden başlatın.</p>
        </div>
        <div className="operation-actions">
          <Button onClick={() => openStockModal(null, "transfer")} disabled={!canWriteProducts || warehouses.length < 2}>
            Depo Transferi
          </Button>
          <Button variant="primary" onClick={() => openProductModal()} disabled={!canWriteProducts}>
            Yeni Ürün
          </Button>
        </div>
      </div>

      <Toast message={message} />

      <FilterBar
        secondary={
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Ürün durumu">
            <option value="">Tüm durumlar</option>
            <option value="local">Yerel kayıt</option>
            <option value="sap">SAP katalog</option>
            <option value="in-stock">Stok var</option>
            <option value="empty">Stok yok</option>
          </select>
        }
        actions={<Button onClick={loadData}>Yenile</Button>}
      >
        <input
          className="filter-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün adı, kod veya kategori ara"
          aria-label="Ürün ara"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Kategori filtresi">
          <option value="">Tüm kategoriler</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FilterBar>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Ürün Kataloğu</h2>
            <p className="list-card-meta">
              <strong>{filteredProducts.length}</strong> ürün gösteriliyor
            </p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredProducts}
          getRowKey={(product) => `${product.code}-${product.id}`}
          loading={loading}
          empty={
            <EmptyState
              icon={productEmptyIcon}
              title="Ürün bulunamadı"
              text="API’den ürün gelmedi veya filtreler sonuç döndürmedi."
              action={
                canWriteProducts ? (
                  <Button variant="primary" onClick={() => openProductModal()}>
                    Yeni Ürün
                  </Button>
                ) : (
                  <Link to="/stocks" className="btn btn-secondary">
                    Stoklara git
                  </Link>
                )
              }
            />
          }
        />
      </div>

      {productModal !== false && (
        <Modal title={productModal ? "Ürün Düzenle" : "Yeni Ürün"} onClose={() => setProductModal(false)}>
          <form onSubmit={handleProductSubmit}>
            {!productModal && (
              <TextInput
                label="Ürün Kodu"
                value={productForm.code}
                onChange={(e) => setProductForm((form) => ({ ...form, code: e.target.value }))}
                error={formErrors.code}
              />
            )}
            <TextInput
              label="Ürün Adı"
              value={productForm.name}
              onChange={(e) => setProductForm((form) => ({ ...form, name: e.target.value }))}
              error={formErrors.name}
            />
            <div className="form-row">
              <TextInput
                label="Birim"
                value={productForm.unit}
                onChange={(e) => setProductForm((form) => ({ ...form, unit: e.target.value }))}
                error={formErrors.unit}
              />
              <TextInput
                label="Kategori"
                value={productForm.category}
                onChange={(e) => setProductForm((form) => ({ ...form, category: e.target.value }))}
              />
            </div>
            <TextInput
              label="Barkod"
              value={productForm.barcode}
              onChange={(e) => setProductForm((form) => ({ ...form, barcode: e.target.value }))}
            />
            <div className="modal-footer">
              <Button onClick={() => setProductModal(false)} disabled={busy}>Vazgeç</Button>
              <Button variant="primary" type="submit" disabled={busy}>
                {busy ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {stockModal && (
        <Modal title="SAP Stok İşlemi" onClose={() => setStockModal(null)}>
          <form onSubmit={handleStockSubmit}>
            <SelectInput
              label="İşlem"
              value={stockForm.action}
              onChange={(e) => setStockForm((form) => ({ ...form, action: e.target.value }))}
            >
              <option value="in">Stok Giriş</option>
              <option value="out">Stok Çıkış</option>
              <option value="transfer">Transfer</option>
            </SelectInput>
            <TextInput
              label="Malzeme Kodu"
              value={stockForm.materialNo}
              onChange={(e) => setStockForm((form) => ({ ...form, materialNo: e.target.value }))}
              required
            />
            {stockForm.action === "transfer" ? (
              <div className="form-row">
                <SelectInput
                  label="Kaynak Depo"
                  value={stockForm.sourceWarehouseId}
                  onChange={(e) => setStockForm((form) => ({ ...form, sourceWarehouseId: e.target.value }))}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.code} value={warehouse.code}>
                      {warehouse.code} - {warehouse.name}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  label="Hedef Depo"
                  value={stockForm.destWarehouseId}
                  onChange={(e) => setStockForm((form) => ({ ...form, destWarehouseId: e.target.value }))}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.code} value={warehouse.code}>
                      {warehouse.code} - {warehouse.name}
                    </option>
                  ))}
                </SelectInput>
              </div>
            ) : (
              <SelectInput
                label="Depo"
                value={stockForm.warehouseId}
                onChange={(e) => setStockForm((form) => ({ ...form, warehouseId: e.target.value }))}
              >
                {warehouses.map((warehouse) => (
                  <option key={warehouse.code} value={warehouse.code}>
                    {warehouse.code} - {warehouse.name}
                  </option>
                ))}
              </SelectInput>
            )}
            <div className="form-row">
              <TextInput
                label="Miktar"
                type="number"
                min="0.01"
                step="0.01"
                value={stockForm.quantity}
                onChange={(e) => setStockForm((form) => ({ ...form, quantity: e.target.value }))}
                required
              />
              <TextInput
                label="Referans No"
                value={stockForm.refNo}
                onChange={(e) => setStockForm((form) => ({ ...form, refNo: e.target.value }))}
              />
            </div>
            <div className="modal-footer">
              <Button onClick={() => setStockModal(null)} disabled={busy}>Vazgeç</Button>
              <Button variant="primary" type="submit" disabled={busy || warehouses.length === 0}>
                {busy ? "İşleniyor..." : "SAP’ye Gönder"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Ürünü Sil"
          message={`"${confirmDelete.name}" ürününü silmek istediğinize emin misiniz?`}
          confirmLabel="Sil"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

export default Products;
