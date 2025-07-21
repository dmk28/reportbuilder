import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { ReportData, Evidence, CVSSMetrics } from '../types/reportTypes'
import EvidenceUploader from './EvidenceUploader'
import CVSSCalculator from './CVSSCalculator'
import { MarkdownRenderer } from '../utils/markdownUtils'
import { getLogoBase64 } from './Logo';

interface ReportFormProps {
  reportData: ReportData
  setReportData: Dispatch<SetStateAction<ReportData>>
}

const ReportForm = ({ reportData, setReportData }: ReportFormProps) => {
  const { t } = useTranslation();
  const [expandedFindings, setExpandedFindings] = useState<number[]>([]);

  const handleInputChange = (field: keyof ReportData, value: string) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addFinding = () => {
    const newIndex = reportData.findings.length;
    setReportData(prev => ({
      ...prev,
      findings: [...prev.findings, {
        title: '',
        severity: 'Medium',
        description: '',
        impact: '',
        remediation: '',
        evidence: [],
        cvss: {
          score: 0,
          vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N',
          metrics: {
            attackVector: 'N',
            attackComplexity: 'L',
            privilegesRequired: 'N',
            userInteraction: 'N',
            scope: 'U',
            confidentiality: 'N',
            integrity: 'N',
            availability: 'N'
          }
        }
      }]
    }));
    // Auto-expand newly added finding
    setExpandedFindings(prev => [...prev, newIndex]);
  }

  const removeFinding = (index: number) => {
    setReportData(prev => ({
      ...prev,
      findings: prev.findings.filter((_, i) => i !== index)
    }));
    // Remove from expanded findings
    setExpandedFindings(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  }

  const updateFindingEvidence = (findingIndex: number, newEvidence: Evidence[]) => {
    setReportData(prev => {
      const updatedFindings = [...prev.findings];
      
      // Make sure we're updating the correct finding
      if (updatedFindings[findingIndex]) {
        updatedFindings[findingIndex] = {
          ...updatedFindings[findingIndex],
          evidence: newEvidence
        };
      }
      
      return {
        ...prev,
        findings: updatedFindings
      };
    });
  };

  const toggleFinding = (index: number) => {
    setExpandedFindings(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const isExpanded = (index: number) => expandedFindings.includes(index);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-blue-600';
      case 'Info': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const updateFindingCVSS = (index: number, metrics: CVSSMetrics) => {
    const { score, vector } = calculateCVSS(metrics);
    const newFindings = [...reportData.findings];
    newFindings[index] = {
      ...newFindings[index],
      cvss: { score, vector, metrics },
      severity: getSeverityFromScore(score)
    };
    setReportData(prev => ({ ...prev, findings: newFindings }));
  };

  const calculateCVSS = (metrics: CVSSMetrics): { score: number; vector: string } => {
    // CVSS 3.1 calculation logic
    const weights = {
      attackVector: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
      attackComplexity: { L: 0.77, H: 0.44 },
      privilegesRequired: { N: 0.85, L: 0.62, H: 0.27 },
      userInteraction: { N: 0.85, R: 0.62 },
      scope: { U: 0, C: 1 },
      confidentiality: { N: 0, L: 0.22, H: 0.56 },
      integrity: { N: 0, L: 0.22, H: 0.56 },
      availability: { N: 0, L: 0.22, H: 0.56 }
    };

    const exploitability = 8.22 * 
      weights.attackVector[metrics.attackVector] * 
      weights.attackComplexity[metrics.attackComplexity] * 
      weights.privilegesRequired[metrics.privilegesRequired] * 
      weights.userInteraction[metrics.userInteraction];

    const impactBase = 1 - ((1 - weights.confidentiality[metrics.confidentiality]) * 
      (1 - weights.integrity[metrics.integrity]) * 
      (1 - weights.availability[metrics.availability]));

    let impact;
    if (metrics.scope === 'U') {
      impact = 6.42 * impactBase;
    } else {
      impact = 7.52 * (impactBase - 0.029) - 3.25 * Math.pow(impactBase - 0.02, 15);
    }

    let baseScore = Math.min(10, impact + exploitability);
    if (impact <= 0) baseScore = 0;
    
    baseScore = Math.ceil(baseScore * 10) / 10;

    const vector = `CVSS:3.1/AV:${metrics.attackVector}/AC:${metrics.attackComplexity}/PR:${metrics.privilegesRequired}/UI:${metrics.userInteraction}/S:${metrics.scope}/C:${metrics.confidentiality}/I:${metrics.integrity}/A:${metrics.availability}`;

    return { score: baseScore, vector };
  };

  const getSeverityFromScore = (score: number): 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' => {
    if (score >= 9.0) return 'Critical';
    if (score >= 7.0) return 'High';
    if (score >= 4.0) return 'Medium';
    if (score >= 0.1) return 'Low';
    return 'Info';
  };

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setReportData(prev => ({ ...prev, logo: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-10">
      <section className="bg-white shadow-card rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-card-hover">
        <h3 className="text-lg font-medium text-primary-700 pb-4 mb-6 border-b border-gray-100">{t('form.section.basicInfo')}</h3>
        <div className="space-y-6">
          {/* Logo upload and preview */}
          <div>
            <label className="form-label" htmlFor="logo-upload">
              {t('form.logo') || 'Logo'}
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 flex items-center justify-center border rounded bg-gray-50 overflow-hidden">
                {reportData.logo ? (
                  <img src={reportData.logo} alt="Logo Preview" className="max-w-full max-h-full" />
                ) : (
                  <img src={getLogoBase64()} alt="Default Logo" className="max-w-full max-h-full" />
                )}
              </div>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="form-input w-auto"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 italic">PNG or JPG, recommended size 200x200px</p>
          </div>

          <div>
            <label className="form-label" htmlFor="clientName">
              {t('form.clientName')}
            </label>
            <input
              id="clientName"
              type="text"
              value={reportData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="form-input"
              placeholder={t('placeholder.clientName')}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="projectName">
              {t('form.projectName')}
            </label>
            <input
              id="projectName"
              type="text"
              value={reportData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className="form-input"
              placeholder={t('placeholder.projectName')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label" htmlFor="startDate">
                {t('form.startDate')}
              </label>
              <input
                id="startDate"
                type="date"
                value={reportData.testingPeriod.startDate}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  testingPeriod: {
                    ...prev.testingPeriod,
                    startDate: e.target.value
                  }
                }))}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label" htmlFor="endDate">
                {t('form.endDate')}
              </label>
              <input
                id="endDate"
                type="date"
                value={reportData.testingPeriod.endDate}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  testingPeriod: {
                    ...prev.testingPeriod,
                    endDate: e.target.value
                  }
                }))}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white shadow-card rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-card-hover">
        <h3 className="text-lg font-medium text-primary-700 pb-4 mb-6 border-b border-gray-100">{t('form.section.reportContent')}</h3>
        <div className="space-y-8">
          <div>
            <label className="form-label" htmlFor="executiveSummary">
              {t('form.executiveSummary')}
            </label>
            <textarea
              id="executiveSummary"
              value={reportData.executiveSummary}
              onChange={(e) => handleInputChange('executiveSummary', e.target.value)}
              rows={4}
              className="form-input"
              placeholder={t('placeholder.executiveSummary')}
            />
            <p className="mt-1 text-xs text-gray-500 italic">
              Markdown supported
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="scope">
              {t('form.scope')}
            </label>
            <textarea
              id="scope"
              value={reportData.scope}
              onChange={(e) => handleInputChange('scope', e.target.value)}
              rows={4}
              className="form-input"
              placeholder={t('placeholder.scope')}
            />
            <p className="mt-1 text-xs text-gray-500 italic">
              Markdown supported
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="methodology">
              {t('form.methodology')}
            </label>
            <textarea
              id="methodology"
              value={reportData.methodology}
              onChange={(e) => handleInputChange('methodology', e.target.value)}
              rows={4}
              className="form-input"
              placeholder={t('placeholder.methodology')}
            />
            <p className="mt-1 text-xs text-gray-500 italic">
              Markdown supported
            </p>
          </div>

          <div>
            <label className="form-label" htmlFor="conclusion">
              {t('form.conclusion')}
            </label>
            <textarea
              id="conclusion"
              value={reportData.conclusion}
              onChange={(e) => handleInputChange('conclusion', e.target.value)}
              rows={4}
              className="form-input"
              placeholder={t('placeholder.conclusion')}
            />
            <p className="mt-1 text-xs text-gray-500 italic">
              Markdown supported
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white shadow-card rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-card-hover">
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-primary-700">{t('form.section.findings')}</h3>
          <button
            type="button"
            onClick={addFinding}
            className="bg-secondary-600 hover:bg-secondary-700 text-white btn"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            {t('button.addFinding')}
          </button>
        </div>
        
        <div className="space-y-8">
          {reportData.findings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 italic text-sm">{t('empty.findings')}</p>
              <button
                type="button"
                onClick={addFinding}
                className="mt-4 text-secondary-600 hover:text-secondary-800 font-medium text-sm"
              >
                <PlusIcon className="h-4 w-4 inline-block mr-1" />
                {t('button.addFinding')}
              </button>
            </div>
          ) : (
            reportData.findings.map((finding, index) => (
              <div key={index} className="relative border rounded-lg bg-gray-50 hover:bg-white transition-colors mb-10 overflow-hidden">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer bg-gray-100"
                  onClick={() => toggleFinding(index)}
                >
                  <div className="flex items-center">
                    {isExpanded(index) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 mr-2" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <h4 className="text-base font-medium">
                      {finding.title || t('empty.title')}
                      {finding.severity && (
                        <span className={`ml-2 text-sm ${getSeverityColor(finding.severity)}`}>
                          ({t(`severity.${finding.severity.toLowerCase()}`)})
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFinding(index);
                      }}
                      className="text-gray-400 hover:text-danger-500 transition-colors"
                      aria-label="Remove finding"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isExpanded(index) && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="form-label">{t('finding.title')}</label>
                        <input
                          type="text"
                          placeholder={t('placeholder.findingTitle')}
                          value={finding.title}
                          onChange={(e) => {
                            const newFindings = [...reportData.findings]
                            newFindings[index] = { ...finding, title: e.target.value }
                            setReportData(prev => ({ ...prev, findings: newFindings }))
                          }}
                          className="form-input"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">{t('finding.severity')}</label>
                        <select
                          value={finding.severity}
                          onChange={(e) => {
                            const newFindings = [...reportData.findings]
                            newFindings[index] = { ...finding, severity: e.target.value as any }
                            setReportData(prev => ({ ...prev, findings: newFindings }))
                          }}
                          className="form-input"
                        >
                          <option value="Critical">{t('severity.critical')}</option>
                          <option value="High">{t('severity.high')}</option>
                          <option value="Medium">{t('severity.medium')}</option>
                          <option value="Low">{t('severity.low')}</option>
                          <option value="Info">{t('severity.info')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">{t('finding.description')}</label>
                      <textarea
                        placeholder={t('placeholder.description')}
                        value={finding.description}
                        onChange={(e) => {
                          const newFindings = [...reportData.findings]
                          newFindings[index] = { ...finding, description: e.target.value }
                          setReportData(prev => ({ ...prev, findings: newFindings }))
                        }}
                        rows={3}
                        className="form-input"
                      />
                      <p className="mt-1 text-xs text-gray-500 italic">
                        Markdown supported
                      </p>
                    </div>

                    <div>
                      <label className="form-label">{t('finding.impact')}</label>
                      <textarea
                        placeholder={t('placeholder.impact')}
                        value={finding.impact}
                        onChange={(e) => {
                          const newFindings = [...reportData.findings]
                          newFindings[index] = { ...finding, impact: e.target.value }
                          setReportData(prev => ({ ...prev, findings: newFindings }))
                        }}
                        rows={2}
                        className="form-input"
                      />
                      <p className="mt-1 text-xs text-gray-500 italic">
                        Markdown supported
                      </p>
                    </div>

                    <div>
                      <label className="form-label">{t('finding.remediation')}</label>
                      <textarea
                        placeholder={t('placeholder.remediation')}
                        value={finding.remediation}
                        onChange={(e) => {
                          const newFindings = [...reportData.findings]
                          newFindings[index] = { ...finding, remediation: e.target.value }
                          setReportData(prev => ({ ...prev, findings: newFindings }))
                        }}
                        rows={2}
                        className="form-input"
                      />
                      <p className="mt-1 text-xs text-gray-500 italic">
                        Markdown supported
                      </p>
                    </div>

                    <div>
                      <label className="form-label">CVSS Calculator</label>
                      <CVSSCalculator
                        metrics={finding.cvss.metrics}
                        onChange={(metrics) => updateFindingCVSS(index, metrics)}
                        score={finding.cvss.score}
                        vector={finding.cvss.vector}
                      />
                    </div>

                    <div>
                      <label className="form-label">{t('finding.evidence')}</label>
                      <EvidenceUploader
                        evidence={finding.evidence || []}
                        onChange={(newEvidence) => updateFindingEvidence(index, newEvidence)}
                        parentId={`finding-${index}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default ReportForm 