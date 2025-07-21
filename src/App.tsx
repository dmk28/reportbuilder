import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  LanguageIcon, 
  DocumentArrowDownIcon, 
  FolderIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import ReportForm from './components/ReportForm'
import ReportPreview from './components/ReportPreview'
import DiscoveryForm from './components/DiscoveryForm'
import ReportList from './components/ReportList'
import { ReportData, Discovery } from './types/reportTypes'
import { exportToPDF, saveMarkdownFile } from './services/robustPdfExportService'
import { saveReport, getReport, StoredReport } from './services/dbService'
import { exportToDocx } from './services/docxExportService'
import { exportToOdt } from './services/odtExportService'
import Logo from './components/Logo'
import './i18n/i18n'
import { v4 as uuidv4 } from 'uuid'

type ViewMode = 'edit' | 'preview'

function App() {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [showReportList, setShowReportList] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [reportData, setReportData] = useState<ReportData>({
    clientName: '',
    projectName: '',
    executiveSummary: '',
    findings: [],
    discoveries: [],
    recommendations: [],
    methodology: '',
    scope: '',
    conclusion: '',
    testingPeriod: {
      startDate: '',
      endDate: ''
    }
  });

  // Sync language state with i18n
  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  // Load report from database if ID is provided
  useEffect(() => {
    const loadReport = async () => {
      if (currentReportId) {
        try {
          const report = await getReport(currentReportId);
          if (report) {
            setReportData(report.reportData);
            setLastSaved(report.lastModified);
          }
        } catch (error) {
          console.error('Error loading report:', error);
        }
      }
    };
    
    loadReport();
  }, [currentReportId]);

  // Auto-save report when data changes
  useEffect(() => {
    const autoSave = async () => {
      if (reportData.clientName || reportData.projectName) {
        setIsSaving(true);
        try {
          const id = await saveReport(reportData, currentReportId || undefined);
          if (!currentReportId) {
            setCurrentReportId(id);
          }
          setLastSaved(new Date());
        } catch (error) {
          console.error('Error auto-saving report:', error);
        } finally {
          setIsSaving(false);
        }
      }
    };
    
    // Debounce auto-save to avoid too many database operations
    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [reportData, currentReportId]);

  // Change language
  const changeLanguage = (lng: string) => {
    console.log(`Changing language to: ${lng}`);
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    document.documentElement.lang = lng;
    setCurrentLanguage(lng);
  };

  // Toggle language between English and Portuguese
  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'pt' : 'en';
    changeLanguage(newLang);
  };

  // Handle export to PDF using the robust service
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(reportData, t, {
        scale: 2,
        quality: 1,
        format: 'a4',
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle export to Markdown
  const handleExportMarkdown = async () => {
    try {
      await saveMarkdownFile(reportData, t);
    } catch (error) {
      console.error('Error exporting markdown:', error);
      alert('Failed to export markdown. Please try again.');
    }
  };

  // Handle export to DOCX
  const handleExportDocx = async () => {
    try {
      await exportToDocx(reportData, t);
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Failed to export DOCX. Please try again.');
    }
  };

  // Handle export to ODT
  const handleExportOdt = async () => {
    try {
      await exportToOdt(reportData, t);
    } catch (error) {
      console.error('Error exporting ODT:', error);
      alert('Failed to export ODT. Please try again.');
    }
  };

  // Create a new report
  const handleCreateNew = () => {
    setReportData({
      clientName: '',
      projectName: '',
      executiveSummary: '',
      findings: [],
      discoveries: [],
      recommendations: [],
      methodology: '',
      scope: '',
      conclusion: '',
      testingPeriod: {
        startDate: '',
        endDate: ''
      }
    });
    setCurrentReportId(null);
    setShowReportList(false);
    setViewMode('edit');
  };

  // Select a report from the list
  const handleSelectReport = (reportId: string) => {
    setCurrentReportId(reportId);
    setShowReportList(false);
    setViewMode('edit');
  };

  // Duplicate a report
  const handleDuplicateReport = async (reportId: string) => {
    try {
      const report = await getReport(reportId);
      if (report) {
        const duplicatedData = {
          ...report.reportData,
          clientName: `${report.reportData.clientName} (${t('reports.copy')})`,
        };
        const newId = await saveReport(duplicatedData);
        setCurrentReportId(newId);
        setReportData(duplicatedData);
        setShowReportList(false);
        setViewMode('edit');
      }
    } catch (error) {
      console.error('Error duplicating report:', error);
    }
  };

  // Update discoveries
  const setDiscoveries = (discoveries: Discovery[]) => {
    setReportData(prev => ({ ...prev, discoveries }));
  };

  // Toggle report list view
  const toggleReportList = () => {
    setShowReportList(!showReportList);
  };

  // Toggle view mode
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo width={40} height={40} />
              <h1 className="ml-3 text-xl font-bold text-gray-900">{t('app.title')}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Status indicator */}
              {lastSaved && (
                <div className="flex items-center text-sm text-gray-500">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isSaving ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                  {isSaving ? t('reports.saving') : `${t('reports.lastSaved')}: ${lastSaved.toLocaleTimeString()}`}
                </div>
              )}

              {/* View mode toggle */}
              {!showReportList && (
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => toggleViewMode('edit')}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'edit' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    {t('button.edit')}
                  </button>
                  <button
                    onClick={() => toggleViewMode('preview')}
                    className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      viewMode === 'preview' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {t('button.preview')}
                  </button>
                </div>
              )}

              {/* Export dropdown */}
              {!showReportList && (
                <div className="relative group">
                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    {isExporting ? t('button.exporting') : t('button.exportPdf')}
                  </button>
                  
                  {/* Export options dropdown */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={handleExportMarkdown}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      {t('button.exportMarkdown')}
                    </button>
                    <button
                      onClick={handleExportDocx}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      {t('button.exportDocx')}
                    </button>
                    <button
                      onClick={handleExportOdt}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      {t('button.exportOdt')}
                    </button>
                  </div>
                </div>
              )}

              {/* Reports button */}
              <button
                onClick={toggleReportList}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {showReportList ? <PlusIcon className="h-5 w-5 mr-1" /> : <FolderIcon className="h-5 w-5 mr-1" />}
                {showReportList ? t('button.newReport') : t('button.myReports')}
              </button>

              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LanguageIcon className="h-5 w-5 mr-1" />
                {currentLanguage === 'en' ? 'EN' : 'PT'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showReportList ? (
          <ReportList
            onSelectReport={handleSelectReport}
            onCreateNew={handleCreateNew}
            onDuplicate={handleDuplicateReport}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className={`${viewMode === 'preview' ? 'hidden lg:block lg:w-1/2' : 'w-full lg:w-1/2'} space-y-8`}>
              <ReportForm reportData={reportData} setReportData={setReportData} />
              <DiscoveryForm
                discoveries={reportData.discoveries}
                setDiscoveries={setDiscoveries}
              />
            </div>
            
            {/* Preview Section */}
            <div className={`${viewMode === 'edit' ? 'hidden lg:block lg:w-1/2' : 'w-full lg:w-1/2'} sticky top-20 self-start`}>
              <ReportPreview reportData={reportData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

