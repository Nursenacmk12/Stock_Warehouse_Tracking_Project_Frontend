import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FilterBar,
  Modal,
  TextInput,
  Toast,
} from "../components/ui/CommonUI.jsx";
import { useAuth } from "../context/useAuth.js";
import { createWarehouse, deleteWarehouse, fetchWarehouses, updateWarehouse } from "../services/warehouseApi.js";

const warehouseEmptyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
    <path d="M3 21V8l9-5 9 5v13" />
    <path d="M9 21v-7h6v7" />
    <path d="M7 10h10" />
  </svg>
);

const emptyForm = { code: "", name: "", location: "" };

function canManage(user) {
  return ["SuperAdmin", "Admin"].includes(user?.role);
}

function Warehouses() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const editable = canManage(user);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setWarehouses(await fetchWarehouses());
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

  const filteredWarehouses = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return warehouses;
    return warehouses.filter((warehouse) =>
      [warehouse.code, warehouse.name, warehouse.location].some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, warehouses]);

  const openModal = (warehouse = null) => {
    setModal(warehouse);
    setErrors({});
    setForm(warehouse ? { code: warehouse.code, name: warehouse.name, location: warehouse.location } : emptyForm);
  };

  const validate = () => {
    const nextErrors = {};
    if (!modal && !form.code.trim()) nextErrors.code = "Depo kodu zorunludur.";
    if (!form.name.trim()) nextErrors.name = "Depo adı zorunludur.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setBusy(true);
    try {
      if (modal) {
        await updateWarehouse(modal.id, form);
        setMessage({ type: "success", text: "Depo güncellendi." });
      } else {
        await createWarehouse(form);
        setMessage({ type: "success", text: "Depo oluşturuldu." });
      }
      setModal(false);
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
      await deleteWarehouse(confirmDelete.id);
      setMessage({ type: "success", text: "Depo silindi." });
      setConfirmDelete(null);
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
      header: "Depo",
      render: (warehouse) => (
        <div className="entity-name">
          <strong>{warehouse.name}</strong>
          <span>{warehouse.code}</span>
        </div>
      ),
    },
    { key: "location", header: "Lokasyon", render: (warehouse) => warehouse.location || "-" },
    {
      key: "createdAt",
      header: "Kayıt",
      render: (warehouse) => (warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString("tr-TR") : "-"),
    },
    {
      key: "actions",
      header: "İşlemler",
      render: (warehouse) => (
        <div className="operation-actions">
          <Button onClick={() => openModal(warehouse)} disabled={!editable}>Düzenle</Button>
          <Button variant="danger" onClick={() => setConfirmDelete(warehouse)} disabled={!editable}>Sil</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Depo ana verisi</span>
          <h1>Depolar</h1>
          <p>Stok giriş, çıkış ve transfer işlemlerinde kullanılan depo kodlarını yönetin.</p>
        </div>
        <Button variant="primary" onClick={() => openModal()} disabled={!editable}>Yeni Depo</Button>
      </div>

      <Toast message={message} />

      <FilterBar actions={<Button onClick={loadData}>Yenile</Button>}>
        <input
          className="filter-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Depo kodu, adı veya lokasyon ara"
          aria-label="Depo ara"
        />
      </FilterBar>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Depo Listesi</h2>
            <p className="list-card-meta">
              <strong>{filteredWarehouses.length}</strong> depo gösteriliyor
            </p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filteredWarehouses}
          getRowKey={(warehouse) => warehouse.id}
          loading={loading}
          empty={
            <EmptyState
              icon={warehouseEmptyIcon}
              title="Depo bulunamadı"
              text="API’den depo kaydı gelmedi."
              action={
                editable ? (
                  <Button variant="primary" onClick={() => openModal()}>
                    Yeni Depo
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

      {modal !== false && (
        <Modal title={modal ? "Depo Düzenle" : "Yeni Depo"} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit}>
            {!modal && (
              <TextInput
                label="Depo Kodu"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                error={errors.code}
              />
            )}
            <TextInput
              label="Depo Adı"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              error={errors.name}
            />
            <TextInput
              label="Lokasyon"
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
            />
            <div className="modal-footer">
              <Button onClick={() => setModal(false)} disabled={busy}>Vazgeç</Button>
              <Button variant="primary" type="submit" disabled={busy}>
                {busy ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Depoyu Sil"
          message={`"${confirmDelete.name}" deposunu silmek istediğinize emin misiniz?`}
          confirmLabel="Sil"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          busy={busy}
        />
      )}
    </div>
  );
}

export default Warehouses;
