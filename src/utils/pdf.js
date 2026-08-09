import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const FONT_REGULAR = "NotoSans";
const FONT_BOLD = "NotoSans";

/** @type {{ regular: string, bold: string } | null} */
let fontCache = null;

function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return binary;
}

async function loadFontBinary(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`PDF font yüklenemedi: ${path}`);
  }
  return arrayBufferToBinaryString(await response.arrayBuffer());
}

async function ensureFonts() {
  if (fontCache) return fontCache;
  const [regular, bold] = await Promise.all([
    loadFontBinary("/fonts/NotoSans-Regular.ttf"),
    loadFontBinary("/fonts/NotoSans-Bold.ttf"),
  ]);
  fontCache = { regular, bold };
  return fontCache;
}

function registerFonts(doc, fonts) {
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
  doc.addFont("NotoSans-Regular.ttf", FONT_REGULAR, "normal");
  doc.addFont("NotoSans-Bold.ttf", FONT_BOLD, "bold");
  doc.setFont(FONT_REGULAR, "normal");
}

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("tr-TR");
}

function formatGeneratedAt() {
  return new Date().toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function drawHeader(doc, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont(FONT_BOLD, "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 12);
  doc.setFont(FONT_REGULAR, "normal");
  doc.setFontSize(9);
  doc.text(subtitle, 14, 20);
  doc.setTextColor(33, 37, 41);
}

function drawFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(220, 227, 236);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.setFont(FONT_REGULAR, "normal");
    doc.setFontSize(8);
    doc.setTextColor(90, 106, 126);
    doc.text("StockGuard · Stok Raporu", 14, pageHeight - 6);
    doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth - 14, pageHeight - 6, { align: "right" });
  }
  doc.setTextColor(33, 37, 41);
}

/**
 * @param {import("jspdf").jsPDF} doc
 * @param {number} startY
 * @param {{ label: string, value: string }[]} kpis
 */
function drawKpiRow(doc, startY, kpis) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const boxWidth = (pageWidth - margin * 2 - gap * (kpis.length - 1)) / kpis.length;
  const boxHeight = 18;

  kpis.forEach((kpi, index) => {
    const x = margin + index * (boxWidth + gap);
    doc.setFillColor(245, 248, 252);
    doc.setDrawColor(220, 227, 236);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, "FD");
    doc.setFont(FONT_REGULAR, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(90, 106, 126);
    doc.text(kpi.label, x + 3, startY + 6);
    doc.setFont(FONT_BOLD, "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text(String(kpi.value), x + 3, startY + 14);
  });

  doc.setTextColor(33, 37, 41);
  return startY + boxHeight + 8;
}

/**
 * @param {import("jspdf").jsPDF} doc
 * @param {number} startY
 * @param {string} title
 * @param {{ label: string, value: number, color?: [number, number, number] }[]} items
 */
function drawBarChart(doc, startY, title, items) {
  if (!items.length) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const chartWidth = pageWidth - margin * 2;
  const rowHeight = 9;
  const maxValue = Math.max(1, ...items.map((item) => Number(item.value) || 0));

  doc.setFont(FONT_BOLD, "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95);
  doc.text(title, margin, startY);
  let y = startY + 5;

  items.forEach((item) => {
    const value = Number(item.value) || 0;
    const barMax = chartWidth - 52;
    const barWidth = Math.max(2, (value / maxValue) * barMax);
    const color = item.color || [91, 141, 239];

    doc.setFont(FONT_REGULAR, "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 70, 80);
    doc.text(item.label, margin, y + 4, { maxWidth: 42 });

    doc.setFillColor(...color);
    doc.roundedRect(margin + 44, y, barWidth, 5.5, 1, 1, "F");

    doc.setFont(FONT_BOLD, "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 95);
    doc.text(formatNumber(value), margin + 46 + barWidth, y + 4.5);

    y += rowHeight;
  });

  doc.setTextColor(33, 37, 41);
  return y + 4;
}

/**
 * @param {import("jspdf").jsPDF} doc
 * @param {number} startY
 * @param {{ title: string, text: string }[]} insights
 */
function drawInsights(doc, startY, insights) {
  if (!insights?.length) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFont(FONT_BOLD, "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95);
  doc.text("Yönetici özeti", margin, startY);

  let y = startY + 4;
  insights.slice(0, 5).forEach((insight) => {
    const block = doc.splitTextToSize(`• ${insight.title}: ${insight.text}`, pageWidth - margin * 2);
    doc.setFont(FONT_REGULAR, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 60, 70);
    doc.text(block, margin, y + 4);
    y += block.length * 4 + 3;
  });

  doc.setTextColor(33, 37, 41);
  return y + 4;
}

/**
 * @param {object} options
 * @param {string} [options.title]
 * @param {{ label: string, value: (row: object) => unknown }[]} options.columns
 * @param {object[]} options.rows
 * @param {{ label: string, value: string|number }[]} [options.kpis]
 * @param {{ title: string, text: string }[]} [options.insights]
 * @param {{ label: string, value: number, color?: [number, number, number] }[]} [options.warehouseBars]
 * @param {{ label: string, value: number, color?: [number, number, number] }[]} [options.movementBars]
 * @param {string} [options.fileName]
 */
export async function downloadPdfReport(options) {
  // Backward-compatible call: downloadPdfReport(title, columns, rows)
  if (typeof options === "string") {
    const title = options;
    const columns = arguments[1];
    const rows = arguments[2];
    return downloadPdfReport({ title, columns, rows });
  }

  const {
    title = "Hareket Raporu",
    columns = [],
    rows = [],
    kpis = [],
    insights = [],
    warehouseBars = [],
    movementBars = [],
    fileName,
  } = options;

  const fonts = await ensureFonts();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(doc, fonts);

  const generatedAt = formatGeneratedAt();
  drawHeader(doc, title, `Oluşturulma: ${generatedAt} · ${formatNumber(rows.length)} satır`);

  let y = 36;

  if (kpis.length > 0) {
    y = drawKpiRow(doc, y, kpis);
  }

  if (insights.length > 0) {
    y = drawInsights(doc, y, insights);
  }

  if (movementBars.length > 0) {
    y = drawBarChart(doc, y, "Dönem hareket özeti", movementBars);
  }

  if (warehouseBars.length > 0) {
    y = drawBarChart(doc, y, "Depo stok dağılımı (üst 5)", warehouseBars);
  }

  doc.setFont(FONT_BOLD, "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 95);
  doc.text("Hareket detayı", 14, y);
  y += 2;

  autoTable(doc, {
    startY: y + 2,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(column.value(row) ?? ""))),
    styles: {
      font: FONT_REGULAR,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [40, 48, 58],
      lineColor: [220, 227, 236],
      lineWidth: 0.2,
    },
    headStyles: {
      font: FONT_BOLD,
      fontStyle: "bold",
      fillColor: [30, 58, 95],
      textColor: [255, 255, 255],
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 252],
    },
    margin: { top: 34, left: 14, right: 14, bottom: 16 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(doc, title, `Oluşturulma: ${generatedAt}`);
      }
    },
  });

  drawFooter(doc);

  const safeName = (fileName || title).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-ğüşıöç]/gi, "");
  doc.save(`${safeName || "rapor"}.pdf`);
}
