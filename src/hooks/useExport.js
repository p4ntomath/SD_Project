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

  const handleExport = async (type, format, { startDate = null, endDate = null, projectIds = null } = {}, setShowExportDialog) => {
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
            await generateProjectOverviewPdf(user.uid, { startDate, endDate, projectIds });
            break;
          case 'funding':
            await generateFundingHistoryReportPdf(user.uid, { startDate, endDate, projectIds });
            break;
          case 'files':
            await generateFolderReportPdf(user.uid);
            break;
          case 'reviews':
            await generateReviewedProjectsReportPdf(user.uid);
            break;
          case 'progress':
            await generateProgressReportPdf(user.uid, { startDate, endDate, projectIds });
            break;
          case 'team':
            await generateTeamReportPdf(user.uid, { startDate, endDate, projectIds });
            break;
          case 'dashboard':
            await Promise.all([
              generateProjectOverviewPdf(user.uid, { startDate, endDate, projectIds }),
              generateFundingHistoryReportPdf(user.uid, { startDate, endDate, projectIds }),
              generateProgressReportPdf(user.uid, { startDate, endDate, projectIds }),
              generateTeamReportPdf(user.uid, { startDate, endDate, projectIds })
            ]);
            break;
          default:
            throw new Error('Invalid export type');
        }
      } else {
        // CSV format with filters
        if (type === 'dashboard') {
          await Promise.all([
            handleDashboardExport(user.uid, 'projects', { startDate, endDate, projectIds }),
            handleDashboardExport(user.uid, 'funding', { startDate, endDate, projectIds }),
            handleDashboardExport(user.uid, 'progress', { startDate, endDate, projectIds }),
            handleDashboardExport(user.uid, 'team', { startDate, endDate, projectIds })
          ]);
        } else {
          await handleDashboardExport(user.uid, type, { startDate, endDate, projectIds });
        }
      }
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    } finally {
      setExportLoading(false);
      setShowExportMenu(false);
      setShowExportDialog(true); // Notify that export is complete
    }
  };

  return {
    exportLoading,
    showExportMenu,
    setShowExportMenu,
    handleExport
  };
};