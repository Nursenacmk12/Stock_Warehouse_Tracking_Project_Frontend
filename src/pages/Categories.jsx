import { useMemo } from "react";
import { getCategories, getProducts } from "../data/mockData";
import "./Categories.css";

const icons = {
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 7h.01" />
      <path d="M3 11.5V7a4 4 0 0 1 4-4h4.5L21 12.5 12.5 21 3 11.5Z" />
    </svg>
  ),
};

function Categories() {
  const categoryStats = useMemo(() => {
    const categories = getCategories();
    const products = getProducts();

    return categories.map((category) => {
      const categoryProducts = products.filter((product) => product.category === category.name);
      const totalStock = categoryProducts.reduce((sum, product) => sum + product.stock, 0);
      const lowStock = categoryProducts.filter(
        (product) => product.stock < product.minStock,
      ).length;

      return {
        ...category,
        productCount: categoryProducts.length,
        totalStock,
        lowStock,
      };
    });
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Kategori özeti</span>
          <h1>Kategoriler</h1>
          <p>Kategorilere göre ürün sayısını, toplam stoğu ve kritik ürün yoğunluğunu görün.</p>
        </div>
      </div>

      {categoryStats.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            {icons.empty}
            <div>
              <strong>Kategori bulunamadı</strong>
              <p>Ürün eklerken kullanılacak kategori listesi henüz oluşturulmamış.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="categories-grid">
          {categoryStats.map((category) => (
            <article key={category.id} className="category-card">
              <div className="category-header">
                <div>
                  <span className="category-code">Kategori {category.id}</span>
                  <h2>{category.name}</h2>
                </div>
                <span className={`badge ${category.lowStock > 0 ? "danger" : "success"}`}>
                  {category.lowStock > 0 ? `${category.lowStock} kritik` : "Sağlıklı"}
                </span>
              </div>

              <div className="category-stats">
                <div className="category-stat">
                  <span>{category.productCount}</span>
                  <p>Ürün</p>
                </div>
                <div className="category-stat">
                  <span>{category.totalStock}</span>
                  <p>Toplam Stok</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default Categories;
