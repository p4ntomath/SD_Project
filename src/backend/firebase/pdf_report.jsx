import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import Papa from "papaparse";
import { 
  generateFolderCSV, 
  generateFundingCSV, 
  generateReviewedProjectsCSV,
  generateProjectOverviewCSV,
  generateProgressCSV,
  generateTeamCSV 
} from "./csv_report";
import { 
  getProjectFunding, 
  getAllProjectFoldersWithFiles,
  getReviewedProjects
} from "./reports";
import { fetchProjects } from "./projectDB";

/**
 * Base PDF generator that converts CSV data into a styled PDF table
 */
const generateBasePdf = (csvData, title = "Report") => {
  try {
    // Parse CSV string into rows
    const { data } = Papa.parse(csvData.trim(), {
      header: false,
      skipEmptyLines: true,
    });

    if (!data || data.length < 1) {
      throw new Error("No data available for PDF generation");
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Create new document in portrait mode, using points as units
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(16);
    doc.text(title, 40, 40);

    // Add table using the plugin
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 60,
      theme: 'striped',
      margin: { left: 40, right: 40 },
      didDrawPage: (data) => {
        // Footer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Generated on: ${new Date().toLocaleDateString()} | Page ${doc.getNumberOfPages()}`,
          40,
          pageHeight - 20
        );
      },
    });

    return doc;
  } catch (error) {
    console.error("Error in PDF generation:", error);
    throw error;
  }
};

/**
 * Generate a PDF report for project overview
 */
export const generateProjectOverviewPdf = async (uid, { startDate = null, endDate = null, projectIds = null } = {}) => {
  try {
    let projectsData = await fetchProjects(uid);
    
    // Apply filters
    if (startDate || endDate) {
      projectsData = projectsData.filter(project => {
        const projectDate = project.createdAt?.toDate?.() || new Date(project.createdAt);
        const isAfterStart = !startDate || projectDate >= new Date(startDate);
        const isBeforeEnd = !endDate || projectDate <= new Date(endDate);
        return isAfterStart && isBeforeEnd;
      });
    }
    
    if (projectIds?.length) {
      projectsData = projectsData.filter(project => projectIds.includes(project.id));
    }

    const csvData = generateProjectOverviewCSV(projectsData);
    const doc = generateBasePdf(csvData, "Projects Overview Report");
    doc.save("projects_overview_report.pdf");
  } catch (error) {
    console.error("Error generating projects overview PDF:", error);
    throw error;
  }
};

/**
 * Generate a PDF report for funding history
 */
export const generateFundingHistoryReportPdf = async (uid, { startDate = null, endDate = null, projectIds = null } = {}) => {
  try {
    let fundingData = await getProjectFunding(uid, startDate ? new Date(startDate) : undefined);
    
    // Apply project filter if specified
    if (projectIds?.length) {
      fundingData = fundingData.filter(project => projectIds.includes(project.id));
    }

    const csvData = generateFundingCSV(fundingData);
    const doc = generateBasePdf(csvData, "Funding History Report");
    doc.save("funding_history_report.pdf");
  } catch (error) {
    console.error("Error generating funding report PDF:", error);
    throw error;
  }
};

/**
 * Generate a PDF report for project progress
 */
export const generateProgressReportPdf = async (uid, { startDate = null, endDate = null, projectIds = null } = {}) => {
  try {
    let projectsData = await fetchProjects(uid);
    
    // Apply filters
    if (startDate || endDate) {
      projectsData = projectsData.filter(project => {
        const projectDate = project.updatedAt?.toDate?.() || new Date(project.updatedAt);
        const isAfterStart = !startDate || projectDate >= new Date(startDate);
        const isBeforeEnd = !endDate || projectDate <= new Date(endDate);
        return isAfterStart && isBeforeEnd;
      });
    }
    
    if (projectIds?.length) {
      projectsData = projectsData.filter(project => projectIds.includes(project.id));
    }

    const csvData = generateProgressCSV(projectsData);
    const doc = generateBasePdf(csvData, "Progress Report");
    doc.save("progress_report.pdf");
  } catch (error) {
    console.error("Error generating progress report PDF:", error);
    throw error;
  }
};

/**
 * Generate a PDF report for team overview
 */
export const generateTeamReportPdf = async (uid, { startDate = null, endDate = null, projectIds = null } = {}) => {
  try {
    let projectsData = await fetchProjects(uid);
    
    // Apply filters
    if (startDate || endDate) {
      projectsData = projectsData.filter(project => {
        const projectDate = project.createdAt?.toDate?.() || new Date(project.createdAt);
        const isAfterStart = !startDate || projectDate >= new Date(startDate);
        const isBeforeEnd = !endDate || projectDate <= new Date(endDate);
        return isAfterStart && isBeforeEnd;
      });
    }
    
    if (projectIds?.length) {
      projectsData = projectsData.filter(project => projectIds.includes(project.id));
    }

    const csvData = generateTeamCSV(projectsData);
    const doc = generateBasePdf(csvData, "Team Overview Report");
    doc.save("team_overview_report.pdf");
  } catch (error) {
    console.error("Error generating team report PDF:", error);
    throw error;
  }
};

/**
 * Generate a PDF report for folders and files
 */
export const generateFolderReportPdf = async (uid) => {
  try {
    const folderData = await getAllProjectFoldersWithFiles(uid);
    const csvData = generateFolderCSV(folderData);
    const doc = generateBasePdf(csvData, "Folders and Files Report");
    doc.save("folders_files_report.pdf");
  } catch (error) {
    console.error("Error generating folder report PDF:", error);
    throw error;
  }
};

/**
 * Generate a PDF report for reviewed projects
 */
export const generateReviewedProjectsReportPdf = async (uid) => {
  try {
    const reviewedData = await getReviewedProjects(uid);
    const csvData = generateReviewedProjectsCSV(reviewedData);
    const doc = generateBasePdf(csvData, "Reviewed Projects Report");
    doc.save("reviewed_projects_report.pdf");
  } catch (error) {
    console.error("Error generating reviewed projects report PDF:", error);
    throw error;
  }
};