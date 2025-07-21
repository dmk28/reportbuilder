import React from 'react';
import { useTranslation } from 'react-i18next';
import { CVSSMetrics } from '../types/reportTypes';

interface CVSSCalculatorProps {
  metrics: CVSSMetrics;
  onChange: (metrics: CVSSMetrics) => void;
  score: number;
  vector: string;
}

const CVSSCalculator: React.FC<CVSSCalculatorProps> = ({
  metrics,
  onChange,
  score,
  vector
}) => {
  const { t } = useTranslation();

  const calculateCVSS = (newMetrics: CVSSMetrics): { score: number; vector: string } => {
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

    // Calculate base score
    const exploitability = 8.22 * 
      weights.attackVector[newMetrics.attackVector] * 
      weights.attackComplexity[newMetrics.attackComplexity] * 
      weights.privilegesRequired[newMetrics.privilegesRequired] * 
      weights.userInteraction[newMetrics.userInteraction];

    const impactBase = 1 - ((1 - weights.confidentiality[newMetrics.confidentiality]) * 
      (1 - weights.integrity[newMetrics.integrity]) * 
      (1 - weights.availability[newMetrics.availability]));

    let impact;
    if (newMetrics.scope === 'U') {
      impact = 6.42 * impactBase;
    } else {
      impact = 7.52 * (impactBase - 0.029) - 3.25 * Math.pow(impactBase - 0.02, 15);
    }

    let baseScore = Math.min(10, impact + exploitability);
    if (impact <= 0) baseScore = 0;
    
    baseScore = Math.ceil(baseScore * 10) / 10;

    // Generate CVSS vector string
    const vector = `CVSS:3.1/AV:${newMetrics.attackVector}/AC:${newMetrics.attackComplexity}/PR:${newMetrics.privilegesRequired}/UI:${newMetrics.userInteraction}/S:${newMetrics.scope}/C:${newMetrics.confidentiality}/I:${newMetrics.integrity}/A:${newMetrics.availability}`;

    return { score: baseScore, vector };
  };

  const handleMetricChange = (metric: keyof CVSSMetrics, value: string) => {
    const newMetrics = { ...metrics, [metric]: value };
    onChange(newMetrics as CVSSMetrics);
  };

  const getSeverityColor = (score: number): string => {
    if (score >= 9.0) return 'text-red-600';
    if (score >= 7.0) return 'text-orange-600';
    if (score >= 4.0) return 'text-yellow-600';
    if (score >= 0.1) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getSeverityLabel = (score: number): string => {
    if (score >= 9.0) return t('severity.critical');
    if (score >= 7.0) return t('severity.high');
    if (score >= 4.0) return t('severity.medium');
    if (score >= 0.1) return t('severity.low');
    return t('severity.info');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">CVSS Score</h4>
          <div className="mt-1 flex items-baseline">
            <span className={`text-2xl font-semibold ${getSeverityColor(score)}`}>
              {score.toFixed(1)}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              ({getSeverityLabel(score)})
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Vector String</p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{vector}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Attack Vector</label>
          <select
            value={metrics.attackVector}
            onChange={(e) => handleMetricChange('attackVector', e.target.value as any)}
            className="form-input"
          >
            <option value="N">Network</option>
            <option value="A">Adjacent</option>
            <option value="L">Local</option>
            <option value="P">Physical</option>
          </select>
        </div>

        <div>
          <label className="form-label">Attack Complexity</label>
          <select
            value={metrics.attackComplexity}
            onChange={(e) => handleMetricChange('attackComplexity', e.target.value as any)}
            className="form-input"
          >
            <option value="L">Low</option>
            <option value="H">High</option>
          </select>
        </div>

        <div>
          <label className="form-label">Privileges Required</label>
          <select
            value={metrics.privilegesRequired}
            onChange={(e) => handleMetricChange('privilegesRequired', e.target.value as any)}
            className="form-input"
          >
            <option value="N">None</option>
            <option value="L">Low</option>
            <option value="H">High</option>
          </select>
        </div>

        <div>
          <label className="form-label">User Interaction</label>
          <select
            value={metrics.userInteraction}
            onChange={(e) => handleMetricChange('userInteraction', e.target.value as any)}
            className="form-input"
          >
            <option value="N">None</option>
            <option value="R">Required</option>
          </select>
        </div>

        <div>
          <label className="form-label">Scope</label>
          <select
            value={metrics.scope}
            onChange={(e) => handleMetricChange('scope', e.target.value as any)}
            className="form-input"
          >
            <option value="U">Unchanged</option>
            <option value="C">Changed</option>
          </select>
        </div>

        <div>
          <label className="form-label">Confidentiality</label>
          <select
            value={metrics.confidentiality}
            onChange={(e) => handleMetricChange('confidentiality', e.target.value as any)}
            className="form-input"
          >
            <option value="N">None</option>
            <option value="L">Low</option>
            <option value="H">High</option>
          </select>
        </div>

        <div>
          <label className="form-label">Integrity</label>
          <select
            value={metrics.integrity}
            onChange={(e) => handleMetricChange('integrity', e.target.value as any)}
            className="form-input"
          >
            <option value="N">None</option>
            <option value="L">Low</option>
            <option value="H">High</option>
          </select>
        </div>

        <div>
          <label className="form-label">Availability</label>
          <select
            value={metrics.availability}
            onChange={(e) => handleMetricChange('availability', e.target.value as any)}
            className="form-input"
          >
            <option value="N">None</option>
            <option value="L">Low</option>
            <option value="H">High</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CVSSCalculator; 