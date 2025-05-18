import { useState } from 'react';
import { auth } from '../backend/firebase/firebaseConfig';
import { handleDashboardExport } from '../backend/firebase/csv_report';
import { 
  generateProjectOverviewPdf,
  generateFundingHistoryReportPdf,
  generateProgressReportPdf,
  generateTeamReportPdf,
  generateFolderReportPdf,
  generateReviewedProjectsReportPdf,
} from '../backend/firebase/pdf_report';

export const useExport = () => {
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = async (type, format) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user logged in");
        return;
      }

      setExportLoading(true);

      if (format === 'pdf') {
        switch (type) {
          case 'projects':
            await generateProjectOverviewPdf(user.uid);
            break;
          case 'funding':
            await generateFundingHistoryReportPdf(user.uid);
            break;
          case 'files':
            await generateFolderReportPdf(user.uid);
            break;
          case 'reviews':
            await generateReviewedProjectsReportPdf(user.uid);
            break;
          case 'progress':
            await generateProgressReportPdf(user.uid);
            break;
          case 'team':
            await generateTeamReportPdf(user.uid);
            break;
          case 'dashboard':
            await Promise.all([
              generateProjectOverviewPdf(user.uid),
              generateFundingHistoryReportPdf(user.uid),
              generateProgressReportPdf(user.uid),
              generateTeamReportPdf(user.uid)
            ]);
            break;
          default:
            throw new Error('Invalid export type');
        }
      } else {
        // CSV format
        if (type === 'dashboard') {
          await Promise.all([
            handleDashboardExport(user.uid, 'projects'),
            handleDashboardExport(user.uid, 'funding'),
            handleDashboardExport(user.uid, 'progress'),
            handleDashboardExport(user.uid, 'team')
          ]);
        } else {
          await handleDashboardExport(user.uid, type);
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
    }
  };

  return {
    exportLoading,
    showExportMenu,
    setShowExportMenu,
    handleExport
  };
};