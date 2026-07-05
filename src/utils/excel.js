import * as XLSX from "xlsx";

export function downloadExcelFromRows(filename, columns, rows) {
  const data = rows.map((row) =>
    columns.reduce((acc, column) => {
      acc[column.label] = column.value(row);
      return acc;
    }, {}),
  );
  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Rapor");
  XLSX.writeFile(book, filename);
}
