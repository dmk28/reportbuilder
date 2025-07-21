import { openDB, DBSchema } from 'idb';
import { ReportData } from '../types/reportTypes';
import { v4 as uuidv4 } from 'uuid';

// Define the database schema
interface ReportDB extends DBSchema {
  reports: {
    key: string;
    value: StoredReport;
    indexes: { 'by-date': Date };
  };
}

// Define the stored report structure
export interface StoredReport {
  id: string;
  reportData: ReportData;
  lastModified: Date;
  created: Date;
}

// Database name and version
const DB_NAME = 'pentest-reports-db';
const DB_VERSION = 1;

// Initialize the database
const initDB = async () => {
  return openDB<ReportDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for reports
      const reportStore = db.createObjectStore('reports', { keyPath: 'id' });
      // Create an index for date-based queries
      reportStore.createIndex('by-date', 'lastModified');
    },
  });
};

// Save a report to the database
export const saveReport = async (reportData: ReportData, id?: string): Promise<string> => {
  const db = await initDB();
  
  // If no ID is provided, create a new report
  const reportId = id || uuidv4();
  
  // Check if the report already exists
  const existingReport = id ? await db.get('reports', id) : null;
  
  const report: StoredReport = {
    id: reportId,
    reportData,
    lastModified: new Date(),
    created: existingReport ? existingReport.created : new Date(),
  };
  
  await db.put('reports', report);
  return reportId;
};

// Get a report by ID
export const getReport = async (id: string): Promise<StoredReport | undefined> => {
  const db = await initDB();
  return db.get('reports', id);
};

// Get all reports
export const getAllReports = async (): Promise<StoredReport[]> => {
  const db = await initDB();
  return db.getAllFromIndex('reports', 'by-date');
};

// Delete a report
export const deleteReport = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('reports', id);
};

// Export a report to JSON
export const exportReportToJSON = (report: StoredReport): string => {
  return JSON.stringify(report.reportData, null, 2);
};

// Import a report from JSON
export const importReportFromJSON = async (jsonString: string): Promise<string> => {
  try {
    const reportData = JSON.parse(jsonString) as ReportData;
    return await saveReport(reportData);
  } catch (error) {
    console.error('Error importing report:', error);
    throw new Error('Invalid report format');
  }
}; 