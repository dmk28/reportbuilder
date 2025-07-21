import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Discovery, Evidence } from '../types/reportTypes';
import { v4 as uuidv4 } from 'uuid';
import EvidenceUploader from './EvidenceUploader';

interface DiscoveryFormProps {
  discoveries: Discovery[];
  setDiscoveries: (discoveries: Discovery[]) => void;
}

const DiscoveryForm: React.FC<DiscoveryFormProps> = ({ discoveries, setDiscoveries }) => {
  const { t } = useTranslation();
  const [expandedDiscoveries, setExpandedDiscoveries] = useState<string[]>([]);

  const addDiscovery = () => {
    const newDiscovery: Discovery = {
      id: uuidv4(),
      title: '',
      category: 'Web',
      description: '',
      details: '',
      evidence: []
    };
    setDiscoveries([...discoveries, newDiscovery]);
    // Auto-expand newly added discovery
    setExpandedDiscoveries(prev => [...prev, newDiscovery.id]);
  };

  const updateDiscovery = (id: string, field: keyof Discovery, value: string) => {
    setDiscoveries(
      discoveries.map(discovery => 
        discovery.id === id 
          ? { ...discovery, [field]: value } 
          : discovery
      )
    );
  };

  const removeDiscovery = (id: string) => {
    setDiscoveries(discoveries.filter(discovery => discovery.id !== id));
    // Remove from expanded discoveries
    setExpandedDiscoveries(prev => prev.filter(discoveryId => discoveryId !== id));
  };

  const updateDiscoveryEvidence = (discoveryId: string, newEvidence: Evidence[]) => {
    setDiscoveries(
      discoveries.map(discovery => 
        discovery.id === discoveryId 
          ? { ...discovery, evidence: newEvidence } 
          : discovery
      )
    );
  };

  const toggleDiscovery = (id: string) => {
    setExpandedDiscoveries(prev => 
      prev.includes(id) 
        ? prev.filter(discoveryId => discoveryId !== id) 
        : [...prev, id]
    );
  };

  const isExpanded = (id: string) => expandedDiscoveries.includes(id);

  return (
    <div className="space-y-8">
      <section className="bg-white shadow-card rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-card-hover">
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
          <h3 className="text-lg font-medium text-primary-700">{t('form.section.discoveries')}</h3>
          <button
            type="button"
            onClick={addDiscovery}
            className="bg-secondary-600 hover:bg-secondary-700 text-white btn"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            {t('button.addDiscovery')}
          </button>
        </div>
        
        <div className="space-y-8">
          {discoveries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 italic text-sm">{t('empty.discoveries')}</p>
              <button
                type="button"
                onClick={addDiscovery}
                className="mt-4 text-secondary-600 hover:text-secondary-800 font-medium text-sm"
              >
                <PlusIcon className="h-4 w-4 inline-block mr-1" />
                {t('button.addDiscovery')}
              </button>
            </div>
          ) : (
            discoveries.map((discovery) => (
              <div key={discovery.id} className="relative border rounded-lg bg-gray-50 hover:bg-white transition-colors mb-10 overflow-hidden">
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer bg-gray-100"
                  onClick={() => toggleDiscovery(discovery.id)}
                >
                  <div className="flex items-center">
                    {isExpanded(discovery.id) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 mr-2" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 mr-2" />
                    )}
                    <h4 className="text-base font-medium">
                      {discovery.title || t('empty.title')}
                      {discovery.category && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({discovery.category})
                        </span>
                      )}
                    </h4>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDiscovery(discovery.id);
                      }}
                      className="text-gray-400 hover:text-danger-500 transition-colors"
                      aria-label="Remove discovery"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {isExpanded(discovery.id) && (
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="form-label">{t('discovery.title')}</label>
                        <input
                          type="text"
                          placeholder={t('placeholder.discoveryTitle')}
                          value={discovery.title}
                          onChange={(e) => updateDiscovery(discovery.id, 'title', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      
                      <div>
                        <label className="form-label">{t('discovery.category')}</label>
                        <select
                          value={discovery.category}
                          onChange={(e) => updateDiscovery(discovery.id, 'category', e.target.value)}
                          className="form-input"
                        >
                          <option value="Web">Web</option>
                          <option value="Network">Network</option>
                          <option value="Host">Host</option>
                          <option value="Mobile">Mobile</option>
                          <option value="Cloud">Cloud</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">{t('discovery.description')}</label>
                      <textarea
                        placeholder={t('placeholder.description')}
                        value={discovery.description}
                        onChange={(e) => updateDiscovery(discovery.id, 'description', e.target.value)}
                        rows={3}
                        className="form-input"
                      />
                      <p className="mt-1 text-xs text-gray-500 italic">
                        Markdown supported
                      </p>
                    </div>

                    <div>
                      <label className="form-label">{t('discovery.details')}</label>
                      <textarea
                        placeholder={t('placeholder.details')}
                        value={discovery.details}
                        onChange={(e) => updateDiscovery(discovery.id, 'details', e.target.value)}
                        rows={4}
                        className="form-input"
                      />
                      <p className="mt-1 text-xs text-gray-500 italic">
                        Markdown supported
                      </p>
                    </div>

                    <div>
                      <label className="form-label">{t('discovery.evidence')}</label>
                      <EvidenceUploader
                        evidence={discovery.evidence || []}
                        onChange={(newEvidence) => updateDiscoveryEvidence(discovery.id, newEvidence)}
                        parentId={`discovery-${discovery.id}`}
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
  );
};

export default DiscoveryForm; 