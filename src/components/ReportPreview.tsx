import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportData, Evidence } from '../types/reportTypes';
import { MarkdownRenderer } from '../utils/markdownUtils';
import SeverityDistribution from './SeverityDistribution';

interface ReportPreviewProps {
  reportData: ReportData;
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const { t } = useTranslation();
  
  const getBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getTranslatedSeverity = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return t('severity.critical');
      case 'high': return t('severity.high');
      case 'medium': return t('severity.medium');
      case 'low': return t('severity.low');
      case 'info': return t('severity.info');
      default: return severity;
    }
  };
  
  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getBadgeColor(severity)}`}>
      {getTranslatedSeverity(severity)}
    </span>
  );
};

const EvidencePreview = ({ evidence }: { evidence: Evidence[] }) => {
  const { t } = useTranslation();
  
  if (!evidence || evidence.length === 0) {
    return <p className="text-sm text-gray-500 italic">{t('empty.evidence')}</p>;
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 mt-4">
      {evidence.map((item) => (
        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h5 className="text-sm font-medium text-gray-700">{item.title}</h5>
          </div>
          <div className="p-4">
            {item.type === 'image' ? (
              <div>
                <img 
                  src={item.content} 
                  alt={item.caption || item.title} 
                  className="w-full h-auto rounded border border-gray-200"
                />
                {item.caption && (
                  <p className="mt-2 text-xs text-gray-500 italic">{item.caption}</p>
                )}
              </div>
            ) : (
              <div>
                <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded border overflow-x-auto">
                  <code>{item.content}</code>
                </pre>
                {item.caption && (
                  <p className="mt-2 text-xs text-gray-500 italic">{item.caption}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface SectionProps {
  title: string;
  children?: ReactNode;
  content?: string | string[];
  emptyText?: string;
}

const Section: React.FC<SectionProps> = ({ title, children, content, emptyText }) => {
  const { t } = useTranslation();
  
  const renderContent = () => {
    if (children) {
      return children;
    }
    
    if (!content) {
      return <p className="text-sm text-gray-500 italic">{emptyText || t('empty.content')}</p>;
    }
    
    if (Array.isArray(content)) {
      if (content.length === 0) {
        return <p className="text-sm text-gray-500 italic">{emptyText || t('empty.content')}</p>;
      }
      
      return (
        <ul className="list-disc pl-5 space-y-2">
          {content.map((item, index) => (
            <li key={index} className="text-gray-700">
              <MarkdownRenderer markdown={item} />
            </li>
          ))}
        </ul>
      );
    }
    
    return <MarkdownRenderer markdown={content} />;
  };
  
  return (
    <div className="mb-8 bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">
        {content || children ? renderContent() : emptyText && <p className="text-gray-500 italic">{emptyText}</p>}
      </div>
    </div>
  );
};

const ReportPreview: React.FC<ReportPreviewProps> = ({ reportData }) => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {reportData.clientName || t('form.clientName')}
          </h1>
          <h2 className="text-xl text-gray-600 mb-4">
            {reportData.projectName || t('form.projectName')}
          </h2>
          {reportData.testingPeriod.startDate && reportData.testingPeriod.endDate && (
            <p className="text-sm text-gray-500">
              {t('report.testingPeriod')}: {formatDate(reportData.testingPeriod.startDate)} - {formatDate(reportData.testingPeriod.endDate)}
            </p>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <Section title={t('report.executiveSummary')}>
        {reportData.executiveSummary ? (
          <MarkdownRenderer markdown={reportData.executiveSummary} />
        ) : (
          <p className="text-sm text-gray-500 italic">{t('empty.executiveSummary')}</p>
        )}
      </Section>

      {/* Recommendations */}
      <Section title={t('report.recommendations')}>
        {reportData.recommendations && reportData.recommendations.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {reportData.recommendations.map((recommendation, index) => (
              <li key={index} className="text-gray-700">
                <MarkdownRenderer markdown={recommendation} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">{t('empty.recommendations')}</p>
        )}
      </Section>

      {/* Scope */}
      <Section title={t('report.scope')}>
        {reportData.scope ? (
          <MarkdownRenderer markdown={reportData.scope} />
        ) : (
          <p className="text-sm text-gray-500 italic">{t('empty.scope')}</p>
        )}
      </Section>

      {/* Methodology */}
      <Section title={t('report.methodology')}>
        {reportData.methodology ? (
          <MarkdownRenderer markdown={reportData.methodology} />
        ) : (
          <p className="text-sm text-gray-500 italic">{t('empty.methodology')}</p>
        )}
      </Section>

      {/* Findings */}
      {reportData.findings && reportData.findings.length > 0 && (
        <div className="space-y-6">
          <Section title={t('report.findings')}>
            <div className="space-y-6">
              {reportData.findings.map((finding, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {index + 1}. {finding.title || t('empty.title')}
                    </h3>
                    <SeverityBadge severity={finding.severity} />
                  </div>
                  
                  {finding.cvss && (
                    <div className="mb-4 p-2 bg-gray-100 rounded text-sm font-mono text-gray-600">
                      CVSS: {finding.cvss.score.toFixed(1)} ({finding.cvss.vector})
                    </div>
                  )}
                  
                  {finding.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        {t('report.description')}
                      </h4>
                      <MarkdownRenderer markdown={finding.description} />
                    </div>
                  )}
                  
                  {finding.impact && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        {t('report.impact')}
                      </h4>
                      <MarkdownRenderer markdown={finding.impact} />
                    </div>
                  )}
                  
                  {finding.remediation && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        {t('report.remediation')}
                      </h4>
                      <MarkdownRenderer markdown={finding.remediation} />
                    </div>
                  )}
                  
                  {finding.evidence && finding.evidence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        {t('report.evidence')}
                      </h4>
                      <EvidencePreview evidence={finding.evidence} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Discoveries */}
      {reportData.discoveries && reportData.discoveries.length > 0 && (
        <Section title={t('report.discoveries')}>
          <div className="space-y-4">
            {reportData.discoveries.map((discovery) => (
              <div key={discovery.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {discovery.title || t('empty.title')}
                  </h3>
                  {discovery.category && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                      {discovery.category}
                    </span>
                  )}
                </div>
                
                {discovery.description && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                      {t('discovery.description')}
                    </h4>
                    <MarkdownRenderer markdown={discovery.description} />
                  </div>
                )}
                
                {discovery.details && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                      {t('discovery.details')}
                    </h4>
                    <MarkdownRenderer markdown={discovery.details} />
                  </div>
                )}
                
                {discovery.evidence && discovery.evidence.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      {t('discovery.evidence')}
                    </h4>
                    <EvidencePreview evidence={discovery.evidence} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Conclusion */}
      <Section title={t('report.conclusion')}>
        {reportData.conclusion ? (
          <MarkdownRenderer markdown={reportData.conclusion} />
        ) : (
          <p className="text-sm text-gray-500 italic">{t('empty.conclusion')}</p>
        )}
      </Section>

      {/* Severity Distribution Chart */}
      {reportData.findings && reportData.findings.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('report.severityDistribution')}</h2>
          <SeverityDistribution findings={reportData.findings} />
        </div>
      )}
    </div>
  );
};

export default ReportPreview; 