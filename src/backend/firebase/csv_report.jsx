import { db, auth } from "./firebaseConfig";
import { query, where } from "firebase/firestore";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  onSnapshot,
  arrayRemove,
} from "firebase/firestore";

import { getProjectFunding, getAllProjectFoldersWithFiles, getReviewedProjects } from "./reports";
import Papa from "papaparse";

// CSV utility for funding
export const generateFundingCSV = (projectsWithFunding) => {
  let csv = "Project Name,Funding Amount,Description,Funding Type,Updated At\n";
  projectsWithFunding.forEach(project => {
    project.fundingHistory.forEach(entry => {
      const name = project.name.replace(/,/g, " ");
      const amount = entry.amount ?? "";
      const source = entry.source?.replace(/,/g, " ") ?? "";
      const type = entry.type ?? "";
      const updatedAt = entry.updatedAt?.toDate?.().toISOString?.() ?? entry.date ?? "";
      csv += `${name},${amount},${source},${type},${updatedAt}\n`;
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
          const uploadedAt = file.uploadedAt instanceof Date
            ? file.uploadedAt.toISOString()
            : (file.uploadedAt ?? "");

          csv += `${project.projectName},${folderName},${fileName},${uploadedBy},${uploadedAt}\n`;
        });
      } else {
        // If no files, still include the folder info
        csv += `${project.projectName},${folderName},,,,\n`;
      }
    });
  });

  return csv;
};
//done with files


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
    console.error("Error exporting researcher data:", error.message);
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
  text?.replace(/[\r\n]+/g, " ").replace(/,/g, " ") ?? "";


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