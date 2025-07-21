import { marked } from 'marked';

// Process markdown content to improve rendering in PDF
export const renderMarkdownForPDF = (markdown: string): HTMLDivElement => {
  // Create a container div
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 595px; /* A4 width in points */
    padding: 0;
    margin: 0;
    background: white;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: rgb(55, 65, 81);
  `;
  
  // Add styles for markdown elements
  const style = document.createElement('style');
  style.textContent = `
    .markdown-content h1, .markdown-content h2, .markdown-content h3, 
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
      margin: 1em 0 0.5em;
      font-weight: bold;
      color: rgb(15, 23, 42);
    }
    .markdown-content h1 { font-size: 16px; }
    .markdown-content h2 { font-size: 14px; }
    .markdown-content h3 { font-size: 13px; }
    .markdown-content h4, .markdown-content h5, .markdown-content h6 { font-size: 12px; }
    
    .markdown-content p {
      margin: 0.8em 0;
      line-height: 1.5;
    }
    
    .markdown-content ul, .markdown-content ol {
      margin: 0.8em 0;
      padding-left: 2em;
    }
    
    .markdown-content li {
      margin: 0.3em 0;
    }
    
    .markdown-content pre {
      margin: 1em 0;
      padding: 1em;
      background: rgb(243, 244, 246);
      border-radius: 4px;
      font-family: Courier, monospace;
      font-size: 10px;
      white-space: pre-wrap;
      page-break-inside: avoid;
    }
    
    .markdown-content code {
      padding: 0.2em 0.4em;
      background: rgb(243, 244, 246);
      border-radius: 3px;
      font-family: Courier, monospace;
      font-size: 10px;
      display: block;
      margin-top: 0.5em;
      margin-bottom: 0.5em;
    }
    
    .markdown-content blockquote {
      margin: 1em 0;
      padding-left: 1em;
      border-left: 4px solid rgb(209, 213, 219);
      color: rgb(107, 114, 128);
    }
    
    .markdown-content table {
      width: 100%;
      margin: 1em 0;
      border-collapse: collapse;
      font-size: 10px;
    }
    
    .markdown-content thead {
      background: rgb(249, 250, 251);
    }
    
    .markdown-content th {
      padding: 0.75em;
      font-weight: bold;
      text-align: left;
      color: rgb(15, 23, 42);
      border-bottom: 1px solid rgb(229, 231, 235);
    }
    
    .markdown-content td {
      padding: 0.75em;
      text-align: left;
      border-bottom: 1px solid rgb(229, 231, 235);
    }
  `;
  
  document.head.appendChild(style);
  
  // Ensure markdown is a string and handle null/undefined cases
  const markdownStr = typeof markdown === 'string' ? markdown : 
                     markdown === null || markdown === undefined ? '' :
                     String(markdown);
  
  // Process the markdown input
  let processedMarkdown = preprocessMarkdown(markdownStr);
  
  // Create a container for the markdown content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'markdown-content';
  
  try {
    // Use marked with standard options to avoid object serialization issues
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    
    const htmlContent = marked.parse(processedMarkdown);
    contentDiv.innerHTML = typeof htmlContent === 'string' ? htmlContent : String(htmlContent);
  } catch (error) {
    console.error('Error rendering markdown:', error);
    contentDiv.innerHTML = processSimpleMarkdown(processedMarkdown);
  }
  
  div.appendChild(contentDiv);
  document.body.appendChild(div);
  
  return div;
};

// Simple markdown processor for fallback
function processSimpleMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```([^`]*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/#{3}\s+(.*?)(?:\n|$)/g, '<h3>$1</h3>')
    .replace(/#{2}\s+(.*?)(?:\n|$)/g, '<h2>$1</h2>')
    .replace(/#{1}\s+(.*?)(?:\n|$)/g, '<h1>$1</h1>')
    .replace(/\n/g, '<br>');
}

// Preprocesses markdown to improve rendering
function preprocessMarkdown(markdown: string): string {
  // Move inline code to its own line for better readability
  markdown = markdown.replace(/(`[^`]+`)/g, '\n$1\n');
  
  // Ensure code blocks have proper spacing
  markdown = markdown.replace(/```([^`]*?)```/gs, '\n```$1```\n');
  
  // Ensure list items have proper spacing
  markdown = markdown.replace(/(\n[*-] )/g, '\n\n$1');
  
  // Add spacing for headings
  markdown = markdown.replace(/(\n#+\s)/g, '\n\n$1');
  
  // Remove extra blank lines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  return markdown;
} 