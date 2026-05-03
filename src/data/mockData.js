export const defaultCategories = [
  { id: 1, name: "Elektronik" },
  { id: 2, name: "Mobilya" },
  { id: 3, name: "Kırtasiye" },
  { id: 4, name: "Büro Malzemeleri" },
  { id: 5, name: "Temizlik" },
];

export const defaultProducts = [
  { id: 1, name: "Dizüstü Bilgisayar", category: "Elektronik", stock: 12, minStock: 10 },
  { id: 2, name: "USB Fare", category: "Elektronik", stock: 45, minStock: 20 },
  { id: 3, name: "Kablosuz Klavye", category: "Elektronik", stock: 28, minStock: 15 },
  { id: 4, name: "LED Monitör", category: "Elektronik", stock: 8, minStock: 10 },
  { id: 5, name: "Lazer Yazıcı", category: "Elektronik", stock: 5, minStock: 8 },
  { id: 6, name: "Ofis Sandalyesi", category: "Mobilya", stock: 15, minStock: 10 },
  { id: 7, name: "Çalışma Masası", category: "Mobilya", stock: 10, minStock: 8 },
  { id: 8, name: "Dolap", category: "Mobilya", stock: 6, minStock: 5 },
  { id: 9, name: "A4 Dosya", category: "Kırtasiye", stock: 120, minStock: 50 },
  { id: 10, name: "Kurşun Kalem", category: "Kırtasiye", stock: 200, minStock: 100 },
  { id: 11, name: "Silgi", category: "Kırtasiye", stock: 85, minStock: 40 },
  { id: 12, name: "Toplantı Masası", category: "Mobilya", stock: 4, minStock: 3 },
  { id: 13, name: "Projeksiyon Cihazı", category: "Elektronik", stock: 3, minStock: 4 },
  { id: 14, name: "USB Kablo", category: "Elektronik", stock: 60, minStock: 30 },
  { id: 15, name: "Web Kamera", category: "Elektronik", stock: 9, minStock: 10 },
  { id: 16, name: "A4 Kağıt", category: "Kırtasiye", stock: 40, minStock: 20 },
  { id: 17, name: "Post-it Not", category: "Kırtasiye", stock: 75, minStock: 30 },
  { id: 18, name: "Zımba", category: "Büro Malzemeleri", stock: 20, minStock: 10 },
  { id: 19, name: "Delgeç", category: "Büro Malzemeleri", stock: 12, minStock: 8 },
  { id: 20, name: "Koli Bandı", category: "Büro Malzemeleri", stock: 18, minStock: 15 },
  { id: 21, name: "Islak Mendil", category: "Temizlik", stock: 25, minStock: 20 },
  { id: 22, name: "El Dezenfektanı", category: "Temizlik", stock: 30, minStock: 25 },
  { id: 23, name: "Çöp Kovası", category: "Temizlik", stock: 8, minStock: 5 },
  { id: 24, name: "Masa Lambası", category: "Elektronik", stock: 14, minStock: 10 },
];

export const STORAGE_KEYS = {
  PRODUCTS: "stock_products",
  CATEGORIES: "stock_categories",
  MOVEMENTS: "stock_movements",
};

function readStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;

    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    writeStorage(STORAGE_KEYS.PRODUCTS, defaultProducts);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    writeStorage(STORAGE_KEYS.CATEGORIES, defaultCategories);
  }
  if (!localStorage.getItem(STORAGE_KEYS.MOVEMENTS)) {
    writeStorage(STORAGE_KEYS.MOVEMENTS, []);
  }
}

export function getProducts() {
  return readStorage(STORAGE_KEYS.PRODUCTS, defaultProducts);
}

export function setProducts(products) {
  writeStorage(STORAGE_KEYS.PRODUCTS, products);
}

export function getCategories() {
  return readStorage(STORAGE_KEYS.CATEGORIES, defaultCategories);
}

export function getMovements() {
  return readStorage(STORAGE_KEYS.MOVEMENTS, []);
}

export function setMovements(movements) {
  writeStorage(STORAGE_KEYS.MOVEMENTS, movements);
}

export function getLowStockProducts() {
  return getProducts().filter((product) => Number(product.stock) < Number(product.minStock));
}

export function getTotalStock() {
  return getProducts().reduce((sum, product) => sum + Number(product.stock || 0), 0);
}

export function getTodayAddedCount() {
  const today = new Date().toDateString();

  return getMovements().filter((movement) => {
    const movementDate = new Date(movement.date);
    return (
      !Number.isNaN(movementDate.getTime()) &&
      movementDate.toDateString() === today &&
      movement.type === "add"
    );
  }).length;
}
