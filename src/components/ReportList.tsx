import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon, PencilIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getAllReports, deleteReport, StoredReport } from '../services/dbService';

interface ReportListProps {
  onSelectReport: (reportId: string) => void;
  onCreateNew: () => void;
  onDuplicate: (reportId: string) => void;
}

const ReportList: React.FC<ReportListProps> = ({ onSelectReport, onCreateNew, onDuplicate }) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reports from the database
  const loadReports = async () => {
    setIsLoading(true);
    try {
      const allReports = await getAllReports();
      // Sort by last modified date (newest first)
      allReports.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      setReports(allReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, []);

  // Handle report deletion
  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(t('confirm.deleteReport'))) {
      try {
        await deleteReport(id);
        await loadReports();
      } catch (error) {
        console.error('Error deleting report:', error);
      }
    }
  };

  // Handle report duplication
  const handleDuplicate = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      onDuplicate(id);
    } catch (error) {
      console.error('Error duplicating report:', error);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t('reports.savedReports')}</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {t('button.newReport')}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <p>{t('reports.loading')}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">{t('reports.noReports')}</p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t('button.createFirst')}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reports.map((report) => (
            <li
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="py-4 px-2 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {report.reportData.clientName || t('reports.untitledClient')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {report.reportData.projectName || t('reports.untitledProject')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('reports.lastModified')}: {formatDate(report.lastModified)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => handleDuplicate(report.id, e)}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                    title={t('button.duplicate')}
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                    title={t('button.delete')}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReportList; 