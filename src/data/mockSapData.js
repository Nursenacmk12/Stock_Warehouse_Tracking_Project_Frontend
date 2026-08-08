/** Frontend fallback datasets used when SAP/live API data fails, times out, or is empty. */

const now = () => new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

export const MOCK_WAREHOUSES = [
  { warehouseId: 1, code: "WH-01", name: "Merkez Depo", location: "İstanbul", createdAt: daysAgo(40) },
  { warehouseId: 2, code: "WH-02", name: "Anadolu Depo", location: "Ankara", createdAt: daysAgo(35) },
  { warehouseId: 3, code: "WH-03", name: "Ege Depo", location: "İzmir", createdAt: daysAgo(20) },
];

export const MOCK_PRODUCTS = [
  {
    productId: 101,
    code: "MAT-1001",
    name: "Mock Ürün 1001",
    unit: "ADET",
    category: "Genel",
    barcode: "8690001001",
    createdAt: daysAgo(10),
  },
  {
    productId: 102,
    code: "MAT-1002",
    name: "Mock Ürün 1002",
    unit: "ADET",
    category: "Elektronik",
    barcode: "8690001002",
    createdAt: daysAgo(8),
  },
  {
    productId: 103,
    code: "MAT-1003",
    name: "Mock Ürün 1003",
    unit: "KG",
    category: "Hammadde",
    barcode: "8690001003",
    createdAt: daysAgo(6),
  },
  {
    productId: 0,
    code: "MAT-2001",
    name: "SAP Katalog Malzeme",
    unit: "ADET",
    category: "Genel",
    barcode: "",
    createdAt: daysAgo(2),
  },
];

export const MOCK_STOCKS = [
  { materialNo: "MAT-1001", warehouseId: "WH-01", quantity: 120, updatedAt: now() },
  { materialNo: "MAT-1002", warehouseId: "WH-01", quantity: 45, updatedAt: now() },
  { materialNo: "MAT-1003", warehouseId: "WH-02", quantity: 200, updatedAt: now() },
  { materialNo: "MAT-1001", warehouseId: "WH-02", quantity: 18, updatedAt: now() },
  { materialNo: "MAT-2001", warehouseId: "WH-03", quantity: 7, updatedAt: now() },
];

export const MOCK_MOVEMENTS = [
  {
    movementId: 9001,
    type: 1,
    typeName: "In",
    quantity: 50,
    date: daysAgo(1),
    refNo: "MOCK-IN-01",
    productCode: "MAT-1001",
    sourceWarehouseCode: "",
    destWarehouseCode: "WH-01",
    userName: "Mock Kullanıcı",
  },
  {
    movementId: 9002,
    type: 2,
    typeName: "Out",
    quantity: 12,
    date: daysAgo(2),
    refNo: "MOCK-OUT-01",
    productCode: "MAT-1002",
    sourceWarehouseCode: "WH-01",
    destWarehouseCode: "",
    userName: "Mock Kullanıcı",
  },
  {
    movementId: 9003,
    type: 3,
    typeName: "Transfer",
    quantity: 8,
    date: daysAgo(3),
    refNo: "MOCK-TR-01",
    productCode: "MAT-1001",
    sourceWarehouseCode: "WH-01",
    destWarehouseCode: "WH-02",
    userName: "Mock Kullanıcı",
  },
];

export const MOCK_DASHBOARD_SUMMARY = {
  sapStatus: "mock",
  productCount: MOCK_PRODUCTS.length,
  warehouseCount: MOCK_WAREHOUSES.length,
  totalStockQuantity: MOCK_STOCKS.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
  emptyStockLines: 0,
  sapOnlyProductCount: MOCK_PRODUCTS.filter((p) => Number(p.productId ?? 0) === 0).length,
  lowStockCount: 2,
  recentMovements: MOCK_MOVEMENTS,
  warehouseStockDistribution: [
    { code: "WH-01", name: "Merkez Depo", quantity: 165 },
    { code: "WH-02", name: "Anadolu Depo", quantity: 218 },
    { code: "WH-03", name: "Ege Depo", quantity: 7 },
  ],
  categoryStockDistribution: [
    { code: "Genel", name: "Genel", quantity: 145 },
    { code: "Elektronik", name: "Elektronik", quantity: 45 },
    { code: "Hammadde", name: "Hammadde", quantity: 200 },
  ],
};

export const MOCK_STOCK_SUMMARY_REPORT = {
  totalQuantity: MOCK_DASHBOARD_SUMMARY.totalStockQuantity,
  productCount: MOCK_PRODUCTS.length,
  warehouseCount: MOCK_WAREHOUSES.length,
  lowStockCount: 2,
  emptyStockLines: 0,
};

export const MOCK_WAREHOUSE_COMPARISON = [
  { warehouseCode: "WH-01", warehouseName: "Merkez Depo", totalQuantity: 165, lineCount: 2 },
  { warehouseCode: "WH-02", warehouseName: "Anadolu Depo", totalQuantity: 218, lineCount: 2 },
  { warehouseCode: "WH-03", warehouseName: "Ege Depo", totalQuantity: 7, lineCount: 1 },
];

export const MOCK_MOVEMENT_TREND = [
  { label: "Pzt", inCount: 4, outCount: 2, transferCount: 1 },
  { label: "Sal", inCount: 6, outCount: 3, transferCount: 2 },
  { label: "Çar", inCount: 3, outCount: 5, transferCount: 1 },
  { label: "Per", inCount: 8, outCount: 2, transferCount: 3 },
  { label: "Cum", inCount: 5, outCount: 4, transferCount: 2 },
  { label: "Cmt", inCount: 2, outCount: 1, transferCount: 0 },
  { label: "Paz", inCount: 1, outCount: 0, transferCount: 1 },
];

export function getMockPagedMovements({ page = 1, pageSize = 20 } = {}) {
  const start = (Math.max(1, page) - 1) * pageSize;
  const items = MOCK_MOVEMENTS.slice(start, start + pageSize);
  return {
    items,
    page: Math.max(1, page),
    pageSize,
    totalCount: MOCK_MOVEMENTS.length,
    totalPages: Math.max(1, Math.ceil(MOCK_MOVEMENTS.length / Math.max(pageSize, 1))),
  };
}
