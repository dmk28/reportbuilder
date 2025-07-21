import React, { useState, useRef, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, XMarkIcon, PhotoIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { Evidence } from '../types/reportTypes';
import { MarkdownRenderer } from '../utils/markdownUtils';

interface EvidenceUploaderProps {
  evidence: Evidence[];
  onChange: (evidence: Evidence[]) => void;
  parentId?: string; // ID of the parent finding/discovery
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ 
  evidence, 
  onChange,
  parentId = 'default'
}) => {
  const { t } = useTranslation();
  // Create a unique ID for each uploader instance
  const componentId = useId();
  const fileInputId = `evidence-upload-${componentId}-${parentId}`;
  
  const [activeTab, setActiveTab] = useState<'image' | 'code'>('image');
  const [codeInput, setCodeInput] = useState('');
  const [codeTitle, setCodeTitle] = useState('');
  const [codeCaption, setCodeCaption] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('text');
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track if this is the component that initiated an update
  const isUpdating = useRef(false);

  const addImageEvidence = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('error.fileTooLarge', { size: '2MB' }));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError(t('error.invalidFileType'));
      return;
    }

    isUpdating.current = true;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const newEvidence: Evidence = {
          id: uuidv4(),
          type: 'image',
          title: file.name,
          content: event.target.result as string,
          caption: '',
        };
        
        // Only update if this component initiated the change
        if (isUpdating.current) {
          const updatedEvidence = [...evidence, newEvidence];
          onChange(updatedEvidence);
          isUpdating.current = false;
        }
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const addCodeEvidence = () => {
    if (!codeInput.trim()) {
      setError(t('error.emptyCode'));
      return;
    }

    isUpdating.current = true;
    const newEvidence: Evidence = {
      id: uuidv4(),
      type: 'code',
      title: codeTitle || t('evidence.defaultCodeTitle'),
      content: codeInput,
      caption: codeCaption,
      language: codeLanguage,
    };
    
    // Only update if this component initiated the change
    if (isUpdating.current) {
      const updatedEvidence = [...evidence, newEvidence];
      onChange(updatedEvidence);
      isUpdating.current = false;
    }
    
    // Reset form
    setCodeInput('');
    setCodeTitle('');
    setCodeCaption('');
    setCodeLanguage('text');
    setError(null);
  };

  const removeEvidence = (id: string) => {
    isUpdating.current = true;
    
    // Only update if this component initiated the change
    if (isUpdating.current) {
      const updatedEvidence = evidence.filter(item => item.id !== id);
      onChange(updatedEvidence);
      isUpdating.current = false;
    }
  };

  return (
    <div className="space-y-6 bg-white p-4 rounded-lg border border-gray-100">
      <div className="border-b border-gray-200">
        <div className="flex items-center -mb-px">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'image'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('image')}
            type="button"
          >
            <PhotoIcon className="h-4 w-4 inline-block mr-1" />
            {t('evidence.uploadImage')}
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'code'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('code')}
            type="button"
          >
            <CodeBracketIcon className="h-4 w-4 inline-block mr-1" />
            {t('evidence.addCode')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {activeTab === 'image' ? (
        <div className="p-4 border border-dashed border-gray-300 rounded-md bg-gray-50 text-center">
          <input
            type="file"
            id={fileInputId}
            accept="image/*"
            onChange={addImageEvidence}
            className="hidden"
          />
          <label
            htmlFor={fileInputId}
            className="flex flex-col items-center justify-center cursor-pointer py-4"
          >
            <PhotoIcon className="h-10 w-10 text-gray-400" />
            <span className="mt-2 text-sm font-medium text-gray-600">
              {t('evidence.dragOrClick')}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              {t('evidence.imageTypes')}
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor={`code-title-${componentId}`} className="form-label">
              {t('evidence.codeTitle')}
            </label>
            <input
              id={`code-title-${componentId}`}
              type="text"
              value={codeTitle}
              onChange={(e) => setCodeTitle(e.target.value)}
              placeholder={t('evidence.codeTitlePlaceholder')}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor={`code-language-${componentId}`} className="form-label">
              {t('evidence.language')}
            </label>
            <select
              id={`code-language-${componentId}`}
              value={codeLanguage}
              onChange={(e) => setCodeLanguage(e.target.value)}
              className="form-input"
            >
              <option value="text">Plain Text</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="csharp">C#</option>
              <option value="php">PHP</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
              <option value="bash">Bash</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>

          <div>
            <label htmlFor={`code-input-${componentId}`} className="form-label">
              {t('evidence.code')}
            </label>
            <textarea
              id={`code-input-${componentId}`}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              rows={5}
              placeholder={t('evidence.codePlaceholder')}
              className="form-input font-mono text-sm"
            />
          </div>

          <div>
            <label htmlFor={`code-caption-${componentId}`} className="form-label">
              {t('evidence.caption')}
            </label>
            <input
              id={`code-caption-${componentId}`}
              type="text"
              value={codeCaption}
              onChange={(e) => setCodeCaption(e.target.value)}
              placeholder={t('evidence.captionPlaceholder')}
              className="form-input"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={addCodeEvidence}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              {t('evidence.addCode')}
            </button>
          </div>
        </div>
      )}

      {evidence.length > 0 && (
        <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
          <h5 className="text-sm font-medium text-gray-700">{t('evidence.current')}</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evidence.map((item) => (
              <div key={item.id} className="border rounded-md overflow-hidden bg-white shadow-sm">
                <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
                  <span className="text-sm font-medium truncate">{item.title}</span>
                  <button
                    type="button"
                    onClick={() => removeEvidence(item.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="p-3">
                  {item.type === 'image' ? (
                    <img
                      src={item.content}
                      alt={item.title}
                      className="max-w-full h-auto rounded max-h-52 mx-auto"
                    />
                  ) : (
                    <div className="text-xs">
                      <MarkdownRenderer
                        markdown={`\`\`\`${item.language || 'text'}\n${item.content}\n\`\`\``}
                      />
                    </div>
                  )}
                </div>
                
                {item.caption && (
                  <div className="px-3 pb-2 text-xs text-gray-600">
                    {item.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader; 