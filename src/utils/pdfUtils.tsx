import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MarkdownRenderer } from './markdownUtils';

// Function to process markdown tables and ensure they're properly formatted
const processMarkdownTables = (content: string): string => {
  // Check if content contains a table
  if (!content.includes('|')) return content;
  
  // Split content by lines
  const lines = content.split('\n');
  let inTable = false;
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  
  // Find table boundaries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Table start detection
    if (!inTable && line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      tableStartIndex = i;
    }
    
    // Table end detection
    if (inTable && (!line.startsWith('|') || line === '')) {
      inTable = false;
      tableEndIndex = i - 1;
      
      // Process this table
      if (tableEndIndex >= tableStartIndex) {
        const tableLines = lines.slice(tableStartIndex, tableEndIndex + 1);
        
        // Ensure header separator row exists and is properly formatted
        if (tableLines.length >= 2) {
          const headerRow = tableLines[0];
          let separatorRow = tableLines[1];
          
          // Check if separator row is properly formatted
          if (!separatorRow.includes('---')) {
            // Create a proper separator row
            const columnCount = (headerRow.match(/\|/g) || []).length - 1;
            separatorRow = '|' + Array(columnCount).fill(' --- ').join('|') + '|';
            
            // Insert the separator row
            tableLines.splice(1, 0, separatorRow);
            lines.splice(tableStartIndex + 1, 0, separatorRow);
            tableEndIndex++;
          }
        }
      }
      
      // Reset for next table
      i = tableEndIndex;
      tableStartIndex = -1;
      tableEndIndex = -1;
    }
  }
  
  // Handle case where table is at the end of content
  if (inTable && tableStartIndex >= 0) {
    tableEndIndex = lines.length - 1;
  }
  
  return lines.join('\n');
};

export const renderMarkdownForPDF = (content: string): HTMLDivElement => {
  // Process tables in the markdown content
  const processedContent = processMarkdownTables(content);
  
  const div = document.createElement('div');
  const element = React.createElement(MarkdownRenderer, { markdown: processedContent });
  const htmlContent = ReactDOMServer.renderToString(element);
  div.innerHTML = htmlContent;

  // Apply PDF-specific styles
  div.style.width = '500px';
  div.style.padding = '20px';
  div.style.fontFamily = 'helvetica';
  div.style.fontSize = '11px';
  div.style.color = 'rgb(55, 65, 81)';
  div.style.backgroundColor = 'white';
  div.style.lineHeight = '1.6';
  
  // Style headings
  const headings = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    (heading as HTMLElement).style.marginTop = '16px';
    (heading as HTMLElement).style.marginBottom = '8px';
    (heading as HTMLElement).style.fontWeight = 'bold';
    (heading as HTMLElement).style.color = 'rgb(15, 23, 42)';
  });
  
  // Adjust heading sizes
  const h1Elements = div.querySelectorAll('h1');
  h1Elements.forEach(h1 => {
    (h1 as HTMLElement).style.fontSize = '16px';
  });
  
  const h2Elements = div.querySelectorAll('h2');
  h2Elements.forEach(h2 => {
    (h2 as HTMLElement).style.fontSize = '14px';
  });
  
  const h3Elements = div.querySelectorAll('h3');
  h3Elements.forEach(h3 => {
    (h3 as HTMLElement).style.fontSize = '13px';
  });
  
  const h4Elements = div.querySelectorAll('h4, h5, h6');
  h4Elements.forEach(h => {
    (h as HTMLElement).style.fontSize = '12px';
  });
  
  // Style paragraphs
  const paragraphs = div.querySelectorAll('p');
  paragraphs.forEach(p => {
    (p as HTMLElement).style.marginBottom = '12px';
    (p as HTMLElement).style.marginTop = '0';
  });
  
  // Style code blocks
  const codeBlocks = div.querySelectorAll('pre code');
  codeBlocks.forEach(block => {
    (block as HTMLElement).style.backgroundColor = '#f3f4f6';
    (block as HTMLElement).style.padding = '8px';
    (block as HTMLElement).style.borderRadius = '4px';
    (block as HTMLElement).style.display = 'block';
    (block as HTMLElement).style.overflowX = 'auto';
    (block as HTMLElement).style.marginBottom = '16px';
    (block as HTMLElement).style.fontFamily = 'monospace';
    (block as HTMLElement).style.fontSize = '10px';
    (block as HTMLElement).style.whiteSpace = 'pre-wrap';
  });
  
  // Style inline code
  const inlineCodes = div.querySelectorAll('code:not(pre code)');
  inlineCodes.forEach(code => {
    (code as HTMLElement).style.backgroundColor = '#f3f4f6';
    (code as HTMLElement).style.padding = '2px 4px';
    (code as HTMLElement).style.borderRadius = '4px';
    (code as HTMLElement).style.fontFamily = 'monospace';
    (code as HTMLElement).style.fontSize = '10px';
  });
  
  // Style lists
  const lists = div.querySelectorAll('ul, ol');
  lists.forEach(list => {
    (list as HTMLElement).style.paddingLeft = '20px';
    (list as HTMLElement).style.marginBottom = '16px';
    (list as HTMLElement).style.marginTop = '8px';
  });
  
  const listItems = div.querySelectorAll('li');
  listItems.forEach(item => {
    (item as HTMLElement).style.marginBottom = '4px';
  });

  // Style tables - improved for better fit
  const tables = div.querySelectorAll('table');
  tables.forEach(table => {
    (table as HTMLElement).style.width = '100%';
    (table as HTMLElement).style.maxWidth = '460px';
    (table as HTMLElement).style.borderCollapse = 'collapse';
    (table as HTMLElement).style.marginBottom = '16px';
    (table as HTMLElement).style.marginTop = '8px';
    (table as HTMLElement).style.fontSize = '10px';
    (table as HTMLElement).style.tableLayout = 'auto'; // Changed to auto for better column sizing
    (table as HTMLElement).style.border = '1px solid #e5e7eb';
    (table as HTMLElement).style.overflow = 'hidden';
  });

  const cells = div.querySelectorAll('th, td');
  cells.forEach(cell => {
    (cell as HTMLElement).style.border = '1px solid #e5e7eb';
    (cell as HTMLElement).style.padding = '6px';
    (cell as HTMLElement).style.textAlign = 'left';
    (cell as HTMLElement).style.wordBreak = 'break-word';
    (cell as HTMLElement).style.verticalAlign = 'top';
    (cell as HTMLElement).style.maxWidth = '150px'; // Limit cell width
  });

  const headers = div.querySelectorAll('th');
  headers.forEach(header => {
    (header as HTMLElement).style.backgroundColor = '#f9fafb';
    (header as HTMLElement).style.fontWeight = 'bold';
    (header as HTMLElement).style.whiteSpace = 'normal'; // Allow wrapping in headers
  });

  // Style links
  const links = div.querySelectorAll('a');
  links.forEach(link => {
    (link as HTMLElement).style.color = '#0284c7';
    (link as HTMLElement).style.textDecoration = 'none';
  });

  // Style blockquotes
  const blockquotes = div.querySelectorAll('blockquote');
  blockquotes.forEach(blockquote => {
    (blockquote as HTMLElement).style.borderLeft = '4px solid #e5e7eb';
    (blockquote as HTMLElement).style.paddingLeft = '16px';
    (blockquote as HTMLElement).style.margin = '16px 0';
    (blockquote as HTMLElement).style.color = '#6b7280';
    (blockquote as HTMLElement).style.fontStyle = 'italic';
  });

  // Style images
  const images = div.querySelectorAll('img');
  images.forEach(img => {
    (img as HTMLElement).style.maxWidth = '100%';
    (img as HTMLElement).style.height = 'auto';
    (img as HTMLElement).style.marginTop = '8px';
    (img as HTMLElement).style.marginBottom = '8px';
  });

  document.body.appendChild(div);
  return div;
}; 