import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadPdfReport(title, columns, rows) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => String(column.value(row) ?? ""))),
  });
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
