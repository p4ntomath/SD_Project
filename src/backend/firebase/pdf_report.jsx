import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { generateFolderCSV, generateFundingCSV, generateReviewedProjectsCSV } from "./csv_report";
import { getProjectFunding, getAllProjectFoldersWithFiles,getReviewedProjects } from "./reports";

/**
 * Converts a CSV string into a structured, styled table inside a PDF.
 * @param {string} csvData - The CSV string.
 * @param {string} title - The title of the PDF report.
 */
const generatePdfFromCSV = (csvData, title = "CSV Report") => {
  // Parse CSV string into rows
  const { data } = Papa.parse(csvData.trim(), {
    header: false,
    skipEmptyLines: true,
  });

  const headers = data[0];
  const rows = data.slice(1);

  const doc = new jsPDF();

  // Title styling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80); // dark gray
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

  // Draw header line
  doc.setDrawColor(180);
  doc.line(14, 24, doc.internal.pageSize.getWidth() - 14, 24);

  // Create styled table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 30,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      textColor: 50,
    },
    headStyles: {
      fillColor: [26, 188, 156], // teal
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // light gray
    },
    theme: "striped",
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()} | Page ${doc.internal.getNumberOfPages()}`,
        14,
        pageHeight - 10
      );
    },
  });

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
};

/**
 * Generates a PDF report for a user's folder and file structure.
 * @param {string} uid - The user ID.
 */
export const generateFundingHistoryReportPdf = async (uid) => {
  try {
    const fundingData = await getProjectFunding(uid, "");
    const csvData = generateFundingCSV(fundingData);
    generatePdfFromCSV(csvData, "Fund History Report");
  } catch (error) {
    console.error("Error generating funding report PDF:", error);
  }
};

export const generateFolderReportPdf = async (uid) => {
  try {
    const folderData = await getAllProjectFoldersWithFiles(uid);
    const csvData = generateFolderCSV(folderData);
    generatePdfFromCSV(csvData, "Folder and File Report");
  } catch (error) {
    console.error("Error generating folder report PDF:", error);
  }
}

export const generateReviewedProjectsReportPdf = async (uid) => {
  try {
    const reviewedData = await getReviewedProjects(uid);
    const csvData = generateReviewedProjectsCSV(reviewedData);
    generatePdfFromCSV(csvData, "Reviewed Projects Report");
  } catch (error) {
    console.error("Error generating reviewed projects report PDF:", error);
  }
};