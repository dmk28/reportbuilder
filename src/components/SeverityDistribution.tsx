import React from 'react';
import { useTranslation } from 'react-i18next';
import { Finding } from '../types/reportTypes';

interface SeverityDistributionProps {
  findings: Finding[];
}

const SeverityDistribution: React.FC<SeverityDistributionProps> = ({ findings }) => {
  const { t } = useTranslation();

  const distribution = {
    Critical: findings.filter(f => f.severity === 'Critical').length,
    High: findings.filter(f => f.severity === 'High').length,
    Medium: findings.filter(f => f.severity === 'Medium').length,
    Low: findings.filter(f => f.severity === 'Low').length,
    Info: findings.filter(f => f.severity === 'Info').length,
  };

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  const severityColors = {
    Critical: 'bg-red-500',
    High: 'bg-orange-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-blue-500',
    Info: 'bg-gray-500',
  };

  const severityTextColors = {
    Critical: 'text-red-600',
    High: 'text-orange-600',
    Medium: 'text-yellow-600',
    Low: 'text-blue-600',
    Info: 'text-gray-600',
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-4">
        {t('findings.distribution')}
      </h3>
      
      <div className="space-y-4">
        {/* Bar chart */}
        <div className="h-4 flex rounded-full overflow-hidden">
          {Object.entries(distribution).map(([severity, count]) => (
            count > 0 && (
              <div
                key={severity}
                className={`${severityColors[severity as keyof typeof severityColors]}`}
                style={{ width: `${(count / total) * 100}%` }}
                title={`${severity}: ${count}`}
              />
            )
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(distribution).map(([severity, count]) => (
            <div key={severity} className="flex items-center">
              <div className={`w-3 h-3 rounded-sm ${severityColors[severity as keyof typeof severityColors]} mr-2`} />
              <span className="flex-1">{t(`severity.${severity.toLowerCase()}`)}</span>
              <span className={`font-medium ${severityTextColors[severity as keyof typeof severityTextColors]}`}>
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="text-sm text-gray-500 border-t pt-2 mt-2">
          {t('findings.total')}: <span className="font-medium text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default SeverityDistribution; 