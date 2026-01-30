import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ---------------- EXPORT TO PDF ---------------- */
export const exportToPDF = ({
  fileName = "export",
  columns = [],
  data = [],
}) => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(fileName, 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [columns.map((c) => c.label)],
    body: data.map((row) => columns.map((c) => row[c.key] ?? "")),
  });

  doc.save(`${fileName}.pdf`);
};

/* ---------------- EXPORT TO EXCEL ---------------- */
export const exportToExcel = ({
  fileName = "export",
  columns = [],
  data = [],
}) => {
  const formattedData = data.map((row) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.label] = row[c.key] ?? "";
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${fileName}.xlsx`);
};
