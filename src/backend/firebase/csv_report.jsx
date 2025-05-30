import { db } from "./firebaseConfig";
import {
  getDoc,
  doc,
} from "firebase/firestore";

import { fetchProjects } from "./projectDB";
import { getProjectFunding, getAllProjectFoldersWithFiles, getReviewedProjects } from "./reports";
import { 
  generateProjectOverviewPdf,
  generateFundingHistoryReportPdf,
  generateFolderReportPdf,
  generateReviewedProjectsReportPdf,
  generateProgressReportPdf,
  generateTeamReportPdf
} from "./pdf_report";

// CSV utility for funding
export const generateFundingCSV = (projectsWithFunding) => {
  let csv = "Project Name,Funding Amount,Source/Description,Type,Added By,Updated At\n";
  projectsWithFunding.forEach(project => {
    project.fundingHistory.forEach(entry => {
      const name = (project.title || project.name || "Unnamed Project").replace(/,/g, " ");
      const amount = entry.amount ?? "";
      const source = entry.type === 'expense' ? 
        (entry.description?.replace(/,/g, " ") ?? "") :
        (entry.source?.replace(/,/g, " ") ?? "");
      const type = entry.type ?? "";
      const addedBy = entry.updatedByName?.replace(/,/g, " ") ?? "Unknown";
      const updatedAt = entry.updatedAt instanceof Date ? 
        entry.updatedAt.toISOString() : 
        (entry.date ?? "");

      csv += `${name},${amount},${source},${type},${addedBy},${updatedAt}\n`;
    });
  });
  return csv;
};

export const generateFolderCSV = (projectsWithFolders) => {
  let csv = "Project Name,Folder Name,File Name,Uploaded By,Uploaded At\n";

  projectsWithFolders.forEach(project => {
    project.folders.forEach(folder => {
      const folderName = folder.name?.replace(/,/g, " ") ?? "";

      if (folder.files && folder.files.length > 0) {
        folder.files.forEach(file => {
          const fileName = file.fileName?.replace(/,/g, " ") ?? "";
          const uploadedBy = file.uploadedBy ?? "";
          const uploadedAt = file.uploadedAt instanceof Date ?
            file.uploadedAt.toISOString() :
            (file.uploadedAt ?? "");

          csv += `${project.projectName},${folderName},${fileName},${uploadedBy},${uploadedAt}\n`;
        });
      } else {
        // If no files, just add a single row for the folder
        csv += `${project.projectName},${folderName},,,\n`;
      }
    });
  });
  return csv;
};

// File download utility
const downloadCSVFile = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up the URL object
};

// Combined controller for researcher access
export const handleResearcherCSVExport = async (uid, { includeFunding = false, includeFolders = false, startDate = null }) => {
  try {
    // Check if user is a researcher
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) throw new Error("User not found");
    const userData = userSnap.data();
    if (userData.role !== "researcher") throw new Error("Access denied: Not a researcher");

    if (includeFunding) {
      const fundingData = await getProjectFunding(uid, startDate);
      const fundingCSV = generateFundingCSV(fundingData);
      downloadCSVFile(fundingCSV, "project_funding.csv");
    }

    if (includeFolders) {
      const folderData = await getAllProjectFoldersWithFiles(uid);
      const folderCSV = generateFolderCSV(folderData);
      downloadCSVFile(folderCSV, "project_folders.csv");
    }
  } catch (error) {
    throw new Error("CSV Export failed");
  }
};


export const generateReviewedProjectsCSV = (reviewedProjects) => {
  let csv = "Project Title,Project Description,Researcher Name,Feedback,Review Date\n";

  reviewedProjects.forEach(project => {
    const title = sanitize(project.title);
    const description = sanitize(project.description);
    const researcher = sanitize(project.researcherName);
    const feedback = sanitize(project.feedback);
    const date = project.date ?? "";

    csv += `${title},${description},${researcher},${feedback},${date}\n`;
  });

  return csv;
};

const sanitize = (text) =>
  text?.replace(/[\r\n]+/g, " ").replace(/,/g, " ").replace(/\s+/g, " ").trim() ?? "";

// New project overview CSV generation
export const generateProjectOverviewCSV = (projects) => {
  let csv = "Project Name,Description,Status,Created Date,Last Updated,Available Funds,Used Funds\n";
  
  projects.forEach(project => {
    const name = sanitize(project.title);
    const description = sanitize(project.description);
    const status = project.status || '';
    const createdAt = project.createdAt?.toDate?.().toISOString() ?? '';
    const updatedAt = project.updatedAt?.toDate?.().toISOString() ?? '';
    const availableFunds = project.availableFunds || 0;
    const usedFunds = project.usedFunds || 0;

    csv += `${name},${description},${status},${createdAt},${updatedAt},${availableFunds},${usedFunds}\n`;
  });

  return csv;
};

export const handleReviewedProjectsExport = async (uid) => {
  try {
    const reviewed = await getReviewedProjects(uid);
    const reviewedCSV = generateReviewedProjectsCSV(reviewed);
    downloadCSVFile(reviewedCSV, "reviewed_projects.csv");
  } catch (error) {
    console.error("Failed to export reviewed projects:", error.message);
    throw new Error("Export failed");
  }
};

// Project overview CSV generation
export const generateProjectsCSV = (projects) => {
  let csv = "Project Name,Description,Status,Start Date,Due Date,Team Size,Goals Count,Available Funds\n";
  
  projects.forEach(project => {
    const name = sanitize(project.title || project.name || "Unnamed Project");
    const description = sanitize(project.description);
    const status = project.status || '';
    const startDate = project.startDate?.toDate?.().toISOString() ?? '';
    const dueDate = project.dueDate?.toDate?.().toISOString() ?? '';
    const teamSize = (project.collaborators?.length || 0) + 1; // +1 for project owner
    const goalsCount = project.goals?.length || 0;
    const availableFunds = project.availableFunds || 0;

    csv += `${name},${description},${status},${startDate},${dueDate},${teamSize},${goalsCount},${availableFunds}\n`;
  });

  return csv;
};

// Combined controller for dashboard exports
export const handleDashboardExport = async (uid, type, { startDate = null, endDate = null, projectIds = null } = {}) => {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    let data;
    let filename;

    // Helper function to filter by date range
    const filterByDateRange = (items, dateField = 'createdAt') => {
      if (!startDate && !endDate) return items;
      return items.filter(item => {
        const itemDate = item[dateField]?.toDate?.() || new Date(item[dateField]);
        const isAfterStart = !startDate || itemDate >= new Date(startDate);
        const isBeforeEnd = !endDate || itemDate <= new Date(endDate);
        return isAfterStart && isBeforeEnd;
      });
    };

    // Helper function to filter by project IDs
    const filterByProjects = (items) => {
      if (!projectIds?.length) return items;
      return items.filter(item => projectIds.includes(item.id));
    };

    switch (type) {
      case 'projects':
        let projectsData = await fetchProjects(uid);
        projectsData = filterByDateRange(projectsData);
        projectsData = filterByProjects(projectsData);
        data = generateProjectsCSV(projectsData);
        filename = 'projects_report';
        break;
      case 'funding':
        const fundingData = await getProjectFunding(uid, startDate);
        data = generateFundingCSV(filterByProjects(fundingData));
        filename = 'funding_report';
        break;
      case 'files':
        let folderData = await getAllProjectFoldersWithFiles(uid);
        folderData = filterByProjects(folderData);
        data = generateFolderCSV(folderData);
        filename = 'files_report';
        break;
      case 'reviews':
        let reviewedData = await getReviewedProjects(uid);
        reviewedData = filterByDateRange(reviewedData, 'reviewDate');
        reviewedData = filterByProjects(reviewedData);
        data = generateReviewedProjectsCSV(reviewedData);
        filename = 'reviews_report';
        break;
      case 'progress':
        let progressData = await fetchProjects(uid);
        progressData = filterByDateRange(progressData);
        progressData = filterByProjects(progressData);
        data = generateProgressCSV(progressData);
        filename = 'progress_report';
        break;
      case 'team':
        let teamData = await fetchProjects(uid);
        teamData = filterByDateRange(teamData);
        teamData = filterByProjects(teamData);
        data = generateTeamCSV(teamData);
        filename = 'team_report';
        break;
      default:
        throw new Error("Invalid report type");
    }

    // Add date range to filename if specified
    if (startDate || endDate) {
      const dateStr = startDate && endDate ? `_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}` : 
                     startDate ? `_from_${startDate.split('T')[0]}` :
                     `_until_${endDate.split('T')[0]}`;
      filename += dateStr;
    }

    downloadCSVFile(data, `${filename}.csv`);
  } catch (error) {
    
    throw error; // Throw the original error instead of creating a new one
  }
};

export const generateProgressCSV = (projects) => {
  let csv = "Project Name,Overall Progress,Total Goals,Completed Goals,Status,Last Updated\n";
  
  projects.forEach(project => {
    const name = sanitize(project.title || project.name || "Unnamed Project");
    const totalGoals = project.goals?.length || 0;
    const completedGoals = project.goals?.filter(goal => goal.completed)?.length || 0;
    const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const status = project.status || '';
    const updatedAt = project.updatedAt?.toDate?.().toISOString() ?? '';

    csv += `${name},${overallProgress}%,${totalGoals},${completedGoals},${status},${updatedAt}\n`;
  });

  return csv;
};

export const generateTeamCSV = (projects) => {
  let csv = "Project Name,Collaborator Name,Role,Access Level,Permissions\n";
  
  projects.forEach(project => {
    const projectName = sanitize(project.title || project.name || "Unnamed Project");
    
    (project.collaborators || []).forEach(collaborator => {
      const name = sanitize(collaborator.name || 'Unknown');
      const role = collaborator.role || 'Collaborator';
      const accessLevel = collaborator.accessLevel || 'Basic';
      const permissions = Object.entries(collaborator.permissions || {})
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
        .join('; ');

      csv += `${projectName},${name},${role},${accessLevel},${permissions}\n`;
    });
  });

  return csv;
};