import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  markdown: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdown, className }) => {
  return (
    <div className={`markdown-content ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // @ts-ignore
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              // @ts-ignore
              <SyntaxHighlighter
                // @ts-ignore
                style={nord}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  margin: '1rem 0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code
                className={`${className || ''} bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // @ts-ignore
          a({ children, ...props }) {
            return (
              <a
                {...props}
                className="text-blue-600 hover:text-blue-800 underline transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          // @ts-ignore
          img(props) {
            return (
              <img 
                {...props} 
                className="max-w-full h-auto rounded-lg border border-gray-200 my-4 shadow-sm" 
                loading="lazy"
              />
            );
          },
          // @ts-ignore
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            );
          },
          // @ts-ignore
          thead({ children }) {
            return <thead className="bg-gray-50">{children}</thead>;
          },
          // @ts-ignore
          th({ children }) {
            return (
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 border-b border-gray-300">
                {children}
              </th>
            );
          },
          // @ts-ignore
          td({ children }) {
            return (
              <td className="py-3 px-4 text-sm text-gray-700 border-b border-gray-200">
                {children}
              </td>
            );
          },
          // @ts-ignore
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">
                {children}
              </blockquote>
            );
          },
          // @ts-ignore
          h1({ children }) {
            return (
              <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200">
                {children}
              </h1>
            );
          },
          // @ts-ignore
          h2({ children }) {
            return (
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                {children}
              </h2>
            );
          },
          // @ts-ignore
          h3({ children }) {
            return (
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">
                {children}
              </h3>
            );
          },
          // @ts-ignore
          h4({ children }) {
            return (
              <h4 className="text-base font-medium text-gray-900 mt-3 mb-2">
                {children}
              </h4>
            );
          },
          // @ts-ignore
          ul({ children }) {
            return (
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                {children}
              </ul>
            );
          },
          // @ts-ignore
          ol({ children }) {
            return (
              <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700">
                {children}
              </ol>
            );
          },
          // @ts-ignore
          li({ children }) {
            return (
              <li className="text-gray-700 leading-relaxed">
                {children}
              </li>
            );
          },
          // @ts-ignore
          p({ children }) {
            return (
              <p className="mb-4 text-gray-700 leading-relaxed">
                {children}
              </p>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export const isMarkdown = (text: string): boolean => {
  // Simple check for markdown patterns
  const markdownPatterns = [
    /^#+ /, // Headers
    /\*\*.+\*\*/, // Bold
    /\*.+\*/, // Italic
    /\`\`.+\`\`/, // Code blocks
    /\`[^`]+\`/, // Inline code
    /\[.+\]\(.+\)/, // Links
    /!\[.+\]\(.+\)/, // Images
    /^\s*[\*\-\+] /, // Unordered lists
    /^\s*\d+\. /, // Ordered lists
    /^\s*>\s+/, // Blockquotes
    /^\s*```/, // Code fences
    /\|.+\|.+\|/, // Tables
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
};

export const textToMarkdown = (text: string): string => {
  // Convert plain text to markdown if it's not already
  if (isMarkdown(text)) {
    return text;
  }

  // Escape special markdown characters
  return text
    .replace(/([*_`#[\]()<>])/g, '\\$1') // Escape markdown special characters
    .replace(/\n/g, '  \n'); // Ensure line breaks are preserved
}; 