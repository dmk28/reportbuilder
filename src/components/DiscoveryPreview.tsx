import React from 'react';
import { useTranslation } from 'react-i18next';
import { Discovery, Evidence } from '../types/reportTypes';
import { MarkdownRenderer } from '../utils/markdownUtils';

interface DiscoveryPreviewProps {
  discoveries: Discovery[];
}

interface EvidencePreviewProps {
  evidence: Evidence[];
}

const EvidencePreview: React.FC<EvidencePreviewProps> = ({ evidence }) => {
  const { t } = useTranslation();

  if (evidence.length === 0) {
    return <p className="text-sm text-gray-500 italic">{t('empty.evidence')}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
      {evidence.map(item => (
        <div key={item.id} className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 p-2 border-b">
            <h6 className="text-xs font-medium text-gray-700">{item.title}</h6>
          </div>
          <div className="p-2">
            {item.type === 'image' ? (
              <img 
                src={item.content} 
                alt={item.title} 
                className="max-w-full h-auto max-h-64 mx-auto object-contain" 
              />
            ) : (
              <div className="text-xs font-mono">
                <MarkdownRenderer
                  markdown={`\`\`\`${item.language || 'text'}\n${item.content}\n\`\`\``}
                />
              </div>
            )}
          </div>
          {item.caption && (
            <div className="px-2 pb-2 text-xs text-gray-500 italic">
              {item.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const { t } = useTranslation();
  
  const getColor = (category: string) => {
    switch (category) {
      case 'Network': return 'bg-blue-100 text-blue-800 ring-blue-600/20';
      case 'Host': return 'bg-green-100 text-green-800 ring-green-600/20';
      case 'Web': return 'bg-purple-100 text-purple-800 ring-purple-600/20';
      case 'Database': return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
      case 'Cloud': return 'bg-sky-100 text-sky-800 ring-sky-600/20';
      case 'Mobile': return 'bg-orange-100 text-orange-800 ring-orange-600/20';
      case 'API': return 'bg-indigo-100 text-indigo-800 ring-indigo-600/20';
      default: return 'bg-gray-100 text-gray-800 ring-gray-600/20';
    }
  };

  const getTranslatedCategory = (category: string) => {
    const key = `discovery.category.${category.toLowerCase()}`;
    return t(key, { defaultValue: category });
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getColor(category)} ring-1 ring-inset`}>
      {getTranslatedCategory(category)}
    </span>
  );
};

const DiscoveryPreview: React.FC<DiscoveryPreviewProps> = ({ discoveries }) => {
  const { t } = useTranslation();

  if (discoveries.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">{t('empty.discoveries')}</p>
    );
  }

  return (
    <div className="space-y-6">
      {discoveries.map(discovery => (
        <div key={discovery.id} className="border rounded-lg p-5 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-medium text-gray-900">
              {discovery.title || t('empty.title')}
            </h4>
            <CategoryBadge category={discovery.category} />
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">{t('discovery.description')}</h5>
              <div className="text-sm text-gray-600">
                <MarkdownRenderer markdown={discovery.description || t('empty.description')} />
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">{t('discovery.details')}</h5>
              <div className="text-sm text-gray-600">
                <MarkdownRenderer markdown={discovery.details || t('empty.details')} />
              </div>
            </div>

            {discovery.evidence && discovery.evidence.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">{t('discovery.evidence')}</h5>
                <EvidencePreview evidence={discovery.evidence} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiscoveryPreview; 