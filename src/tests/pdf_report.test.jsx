import { vi } from 'vitest';
import { 
    generateBasePdf,
    generateProjectOverviewPdf,
    generateFundingHistoryReportPdf,
    generateProgressReportPdf,
    generateTeamReportPdf,
    generateFolderReportPdf,
    generateReviewedProjectsReportPdf
} from '../backend/firebase/pdf_report';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { fetchProjects } from '../backend/firebase/projectDB';
import { 
    getProjectFunding, 
    getAllProjectFoldersWithFiles,
    getReviewedProjects 
} from '../backend/firebase/reports';
import {
    generateFolderCSV,
    generateFundingCSV,
    generateReviewedProjectsCSV,
    generateProjectOverviewCSV,
    generateProgressCSV,
    generateTeamCSV
} from '../backend/firebase/csv_report';

// Mock dependencies
vi.mock('jspdf', () => ({
    jsPDF: vi.fn().mockImplementation(() => ({
        setFontSize: vi.fn(),
        text: vi.fn(),
        save: vi.fn(),
        setTextColor: vi.fn(),
        internal: {
            pageSize: { height: 800 }
        },
        getNumberOfPages: vi.fn().mockReturnValue(1)
    }))
}));

vi.mock('jspdf-autotable', () => ({
    default: vi.fn()
}));

vi.mock('../backend/firebase/reports', () => ({
    getProjectFunding: vi.fn(),
    getAllProjectFoldersWithFiles: vi.fn(),
    getReviewedProjects: vi.fn()
}));

vi.mock('../backend/firebase/projectDB', () => ({
    fetchProjects: vi.fn()
}));

vi.mock('../backend/firebase/csv_report', () => ({
    generateFolderCSV: vi.fn(),
    generateFundingCSV: vi.fn(),
    generateReviewedProjectsCSV: vi.fn(),
    generateProjectOverviewCSV: vi.fn(),
    generateProgressCSV: vi.fn(),
    generateTeamCSV: vi.fn()
}));

describe('PDF Report Generation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateBasePdf', () => {
        it('should create a PDF with the provided CSV data and title', async () => {
            const csvData = 'header1,header2\nvalue1,value2';
            const title = 'Test Report';

            const doc = generateBasePdf(csvData, title);

            expect(jsPDF).toHaveBeenCalledWith({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4'
            });
            expect(autoTable).toHaveBeenCalled();
            expect(doc.setFontSize).toHaveBeenCalledWith(16);
            expect(doc.text).toHaveBeenCalledWith(title, 40, 40);
        });

        it('should handle empty CSV data', () => {
            const csvData = '';
            expect(() => generateBasePdf(csvData)).toThrow('No data available for PDF generation');
        });
    });

    describe('generateProjectOverviewPdf', () => {
        it('should generate a project overview PDF with filters', async () => {
            const mockProjects = [{ 
                id: '1', 
                title: 'Project 1', 
                createdAt: new Date() 
            }];
            const mockCsvData = 'Project Overview Data';
            const filters = {
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                projectIds: ['1']
            };

            vi.mocked(fetchProjects).mockResolvedValue(mockProjects);
            vi.mocked(generateProjectOverviewCSV).mockReturnValue(mockCsvData);

            await generateProjectOverviewPdf('user123', filters);

            expect(fetchProjects).toHaveBeenCalledWith('user123');
            expect(generateProjectOverviewCSV).toHaveBeenCalledWith(expect.any(Array));
        });
    });

    describe('generateFundingHistoryReportPdf', () => {
        it('should generate a funding history PDF', async () => {
            const mockFundingData = [{ amount: 1000, date: new Date() }];
            const mockCsvData = 'Funding History Data';

            vi.mocked(getProjectFunding).mockResolvedValue(mockFundingData);
            vi.mocked(generateFundingCSV).mockReturnValue(mockCsvData);

            await generateFundingHistoryReportPdf('user123');

            expect(getProjectFunding).toHaveBeenCalledWith('user123', undefined);
            expect(generateFundingCSV).toHaveBeenCalledWith(mockFundingData);
        });
    });

    describe('generateFolderReportPdf', () => {
        it('should generate a folders and files report PDF', async () => {
            const mockFolderData = [{ 
                id: '1', 
                name: 'Test Folder',
                files: [{ name: 'test.pdf', size: 1024 }]
            }];
            const mockCsvData = 'Folder Report Data';

            vi.mocked(getAllProjectFoldersWithFiles).mockResolvedValue(mockFolderData);
            vi.mocked(generateFolderCSV).mockReturnValue(mockCsvData);

            await generateFolderReportPdf('user123');

            expect(getAllProjectFoldersWithFiles).toHaveBeenCalledWith('user123');
            expect(generateFolderCSV).toHaveBeenCalledWith(mockFolderData);
        });
    });

    describe('generateReviewedProjectsReportPdf', () => {
        it('should generate a reviewed projects report PDF', async () => {
            const mockReviewData = [{ 
                projectId: '1',
                reviewerId: 'reviewer1',
                status: 'approved'
            }];
            const mockCsvData = 'Review Report Data';

            vi.mocked(getReviewedProjects).mockResolvedValue(mockReviewData);
            vi.mocked(generateReviewedProjectsCSV).mockReturnValue(mockCsvData);

            await generateReviewedProjectsReportPdf('user123');

            expect(getReviewedProjects).toHaveBeenCalledWith('user123');
            expect(generateReviewedProjectsCSV).toHaveBeenCalledWith(mockReviewData);
        });
    });

    // Error handling tests
    describe('Error Handling', () => {
        it('should handle PDF generation errors', async () => {
            vi.mocked(jsPDF).mockImplementation(() => {
                throw new Error('PDF generation failed');
            });

            const csvData = 'header1,header2\nvalue1,value2';
            expect(() => generateBasePdf(csvData)).toThrow('PDF generation failed');
        });

        it('should handle CSV parsing errors', () => {
            const invalidCsvData = null;
            expect(() => generateBasePdf(invalidCsvData)).toThrow();
        });
    });
});