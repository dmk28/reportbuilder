import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { ReportData, Finding, Discovery, Evidence } from '../types/reportTypes';
import { TFunction } from 'i18next';
import { renderMarkdownForPDF } from '../utils/pdfUtils';
import { getLogoBase64 } from '../components/Logo';
import JSZip from 'jszip';

// Helper function to detect if content contains a table
const containsTable = (content: string): boolean => {
  return content.includes('|') && content.includes('\n|');
};

// Helper function to extract tables from markdown content
const extractTables = (content: string): { tables: string[], nonTableContent: string } => {
  if (!containsTable(content)) {
    return { tables: [], nonTableContent: content };
  }
  
  const lines = content.split('\n');
  const tables: string[] = [];
  const nonTableLines: string[] = [];
  
  let currentTable: string[] = [];
  let inTable = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      if (!inTable) {
        inTable = true;
      }
      currentTable.push(line);
    } else if (inTable) {
      // End of table
      if (currentTable.length > 0) {
        tables.push(currentTable.join('\n'));
        currentTable = [];
      }
      inTable = false;
      nonTableLines.push(line);
    } else {
      nonTableLines.push(line);
    }
  }
  
  // Handle case where table is at the end of content
  if (currentTable.length > 0) {
    tables.push(currentTable.join('\n'));
  }
  
  return {
    tables,
    nonTableContent: nonTableLines.join('\n')
  };
};

// Helper function to parse markdown table into data for jspdf-autotable
const parseMarkdownTable = (tableContent: string): { headers: string[], rows: string[][] } => {
  const lines = tableContent.split('\n').filter(line => line.trim() !== '');
  
  // Extract headers from first row
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .filter(cell => cell.trim() !== '')
    .map(cell => cell.trim());
  
  // Skip header and separator rows
  const dataRows = lines.slice(2);
  const rows = dataRows.map(row => 
    row
      .split('|')
      .filter(cell => cell.trim() !== '')
      .map(cell => cell.trim())
  );
  
  return { headers, rows };
};

// Helper function to safely stringify content
const safeStringify = (content: any): string => {
  if (content === null || content === undefined) {
    return '';
  }
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch (error) {
      console.error('Error stringifying content:', error);
      return String(content);
    }
  }
  return String(content);
};

// Helper function to format finding content
const formatFindingContent = (finding: Finding): string => {
  let content = '';
  
  if (finding.title) {
    content += `# ${finding.title}\n\n`;
  }
  
  if (finding.description) {
    content += `${finding.description}\n\n`;
  }
  
  if (finding.impact) {
    content += `## Impact\n${finding.impact}\n\n`;
  }
  
  if (finding.remediation) {
    content += `## Remediation\n${finding.remediation}\n\n`;
  }
  
  if (finding.evidence && finding.evidence.length > 0) {
    content += `## Evidence\n`;
    finding.evidence.forEach((evidence, index) => {
      if (evidence.content) {
        content += `\n### Evidence ${index + 1}\n${evidence.content}\n`;
      }
    });
  }
  
  return content;
};

// Helper function to format discovery content
const formatDiscoveryContent = (discovery: Discovery): string => {
  let content = '';
  
  if (discovery.title) {
    content += `# ${discovery.title}\n\n`;
  }
  
  if (discovery.description) {
    content += `${discovery.description}\n\n`;
  }
  
  if (discovery.evidence && discovery.evidence.length > 0) {
    content += `## Evidence\n`;
    discovery.evidence.forEach((evidence, index) => {
      if (evidence.content) {
        content += `\n### Evidence ${index + 1}\n${evidence.content}\n`;
      }
    });
  }
  
  return content;
};

// Helper function to add section title
const addSectionTitle = (doc: jsPDF, title: string, y: number = 20): number => {
  // Check if we need a new page
  if (y > doc.internal.pageSize.height - 40) {
    doc.addPage();
    y = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title, 20, y);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  return y + 15;
};

// Helper function to add markdown content
const addMarkdownContent = async (doc: jsPDF, content: string, startY: number = 30): Promise<number> => {
  if (!content || content.trim() === '') {
    return startY;
  }
  
  let yPos = startY;
  const safeContent = safeStringify(content);
  
  try {
    // Check if content contains tables
    if (containsTable(safeContent)) {
      // Extract tables and non-table content
      const { tables, nonTableContent } = extractTables(safeContent);
      
      // First add non-table content
      if (nonTableContent.trim()) {
        yPos = await renderNonTableContent(doc, nonTableContent, yPos);
      }
      
      // Then add each table
      for (const tableContent of tables) {
        yPos = await renderTable(doc, tableContent, yPos);
      }
    } else {
      // If there are no tables, just render the content as is
      yPos = await renderNonTableContent(doc, safeContent, yPos);
    }
  } catch (error) {
    console.error('Error adding markdown content:', error);
    // Fallback to simple text rendering
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(safeContent.substring(0, 500) + (safeContent.length > 500 ? '...' : ''), 20, yPos);
    yPos += 10;
  }
  
  return yPos;
};

// Helper function to add findings section
const addFindingsSection = async (doc: jsPDF, findings: Finding[], startY: number): Promise<number> => {
  if (!findings || findings.length === 0) {
    return startY;
  }
  
  let yPos = addSectionTitle(doc, 'Findings', startY);
  
  for (const finding of findings) {
    const formattedContent = formatFindingContent(finding);
    yPos = await addMarkdownContent(doc, formattedContent, yPos + 10);
  }
  
  return yPos;
};

// Helper function to add discoveries section
const addDiscoveriesSection = async (doc: jsPDF, discoveries: Discovery[], startY: number): Promise<number> => {
  if (!discoveries || discoveries.length === 0) {
    return startY;
  }
  
  let yPos = addSectionTitle(doc, 'Discoveries', startY);
  
  for (const discovery of discoveries) {
    const formattedContent = formatDiscoveryContent(discovery);
    yPos = await addMarkdownContent(doc, formattedContent, yPos + 10);
  }
  
  return yPos;
};

// Updated non-table content rendering
const renderNonTableContent = async (doc: jsPDF, content: string, startY: number): Promise<number> => {
  let yPos = startY;
  
  try {
    // We need to explicitly ensure we have a string
    const contentStr = String(content);
    
    // Split content into more manageable chunks
    const chunks = splitContentIntoChunks(contentStr, 5000);
    
    for (const chunk of chunks) {
      // Create HTML representation
      const div = renderMarkdownForPDF(chunk);
      
      try {
        // Render to canvas
        const canvas = await html2canvas(div, {
          scale: 1.5,
          logging: false,
          useCORS: true,
          backgroundColor: 'white',
          width: div.offsetWidth,
          height: div.offsetHeight
        });
        
        // Get image data
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        // Calculate dimensions
        const imgWidth = doc.internal.pageSize.width - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page
        if (yPos + imgHeight > doc.internal.pageSize.height - 20) {
          doc.addPage();
          yPos = 20;
        }
        
        // Add the image to the PDF
        doc.addImage(imgData, 'JPEG', 20, yPos, imgWidth, imgHeight, undefined, 'MEDIUM');
        
        // Clean up
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
        
        // Update position
        yPos += imgHeight + 5;
      } catch (error) {
        console.error('Error rendering chunk to canvas:', error);
        
        // Fallback to simple text rendering
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          // Check for page overflow
          if (yPos > doc.internal.pageSize.height - 20) {
            doc.addPage();
            yPos = 20;
          }
          
          // Just draw as plain text
          doc.text(line, 20, yPos);
          yPos += 6;
        }
        
        // Clean up
        if (div.parentNode) {
          div.parentNode.removeChild(div);
        }
      }
    }
  } catch (error) {
    console.error('Error processing content:', error);
    
    // Ultimate fallback - render as plain text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(String(content).substring(0, 500) + (content.length > 500 ? '...' : ''), 20, yPos);
    yPos += 10;
  }
  
  return yPos;
};

// Helper function to render a table using jspdf-autotable
const renderTable = async (doc: jsPDF, tableContent: string, startY: number): Promise<number> => {
  try {
    const { headers, rows } = parseMarkdownTable(tableContent);
    
    // Check if we need a new page
    if (startY + 20 > doc.internal.pageSize.height - 20) {
      doc.addPage();
      startY = 20;
    }
    
    // Add the table using autotable
    autoTable(doc, {
      startY: startY + 5,
      head: [headers],
      body: rows,
      margin: { left: 20, right: 20 },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      tableWidth: 'auto',
      columnStyles: {},
      didDrawPage: (data) => {
        // Add page numbers
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${doc.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });
    
    // Get the final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    return finalY;
  } catch (error) {
    console.error('Error rendering table:', error);
    return startY + 10;
  }
};

// Improve evidence handling in PDF export
const addEvidence = async (doc: jsPDF, evidence: Evidence[], t: TFunction, startY: number = 30): Promise<number> => {
  let yPos = startY;

  // Sort evidence - images first, then code
  const sortedEvidence = [...evidence].sort((a, b) => {
    if (a.type === 'image' && b.type !== 'image') return -1;
    if (a.type !== 'image' && b.type === 'image') return 1;
    return 0;
  });

  for (const item of sortedEvidence) {
    // Add section break before each evidence item
    doc.setDrawColor(220, 220, 220);
    doc.line(20, yPos - 2, doc.internal.pageSize.width - 20, yPos - 2);
    yPos += 5;

    // Add title with nice formatting
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const titleWidth = doc.getTextWidth(item.title);
    const availableWidth = doc.internal.pageSize.width - 40;

    // Check if title needs to be wrapped
    if (titleWidth > availableWidth) {
      // Split title into multiple lines
      let words = item.title.split(' ');
      let currentLine = '';
      let lines = [];

      for (let i = 0; i < words.length; i++) {
        const tempLine = currentLine + (currentLine ? ' ' : '') + words[i];
        if (doc.getTextWidth(tempLine) <= availableWidth) {
          currentLine = tempLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      // Draw title lines
      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], 20, yPos);
        yPos += 7;
      }
    } else {
      doc.text(item.title, 20, yPos);
      yPos += 8;
    }

    if (item.type === 'image') {
      try {
        // Process the image for PDF
        const imgElement = new Image();
        await new Promise<void>((resolve, reject) => {
          imgElement.onload = () => {
            try {
              // Create a canvas to resize the image if needed
              const canvas = document.createElement('canvas');
              let width = imgElement.width;
              let height = imgElement.height;
              
              // Calculate proportional dimensions that fit the page
              const maxWidth = doc.internal.pageSize.width - 60; // Allow margins
              const maxHeight = doc.internal.pageSize.height - 40; // Allow margins
              
              // If image is too large, resize proportionally
              if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
              }
              
              // Further check height after width adjustment
              if (height > maxHeight) {
                const ratio = maxHeight / height;
                height = maxHeight;
                width = width * ratio;
              }
              
              // Set canvas dimensions and draw image
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Draw with white background to handle transparency
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(imgElement, 0, 0, width, height);
                
                // Get image data with higher quality
                const imageData = canvas.toDataURL('image/jpeg', 0.95);
                
                // Calculate dimensions for PDF
                // Keep original aspect ratio but fit within page
                const pdfImgWidth = Math.min(160, width * 0.5);
                const pdfImgHeight = (height * pdfImgWidth) / width;
                
                // Check if we need a new page for the image
                if (yPos + pdfImgHeight > doc.internal.pageSize.height - 20) {
                  doc.addPage();
                  yPos = 20;
                }
                
                // Center the image
                const xPos = (doc.internal.pageSize.width - pdfImgWidth) / 2;
                
                // Add a light background for the image
                doc.setFillColor(250, 250, 250);
                doc.roundedRect(
                  xPos - 5, 
                  yPos - 5, 
                  pdfImgWidth + 10, 
                  pdfImgHeight + 10, 
                  3, 3, 
                  'F'
                );
                
                // Add the image
                doc.addImage(
                  imageData,
                  'JPEG',
                  xPos,
                  yPos,
                  pdfImgWidth,
                  pdfImgHeight,
                  undefined,
                  'MEDIUM'
                );
                
                // Add a thin border around the image
                doc.setDrawColor(220, 220, 220);
                doc.roundedRect(
                  xPos - 5, 
                  yPos - 5, 
                  pdfImgWidth + 10, 
                  pdfImgHeight + 10, 
                  3, 3, 
                  'S'
                );
                
                yPos += pdfImgHeight + 15;
              }
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          imgElement.onerror = reject;
          imgElement.src = item.content;
        });
      } catch (error) {
        console.error('Error processing image:', error);
        doc.setTextColor(220, 20, 20); // Red color for error
        doc.text(t('error.imageProcessing'), 20, yPos);
        doc.setTextColor(55, 65, 81); // Reset color
        yPos += 10;
      }
    } else {
      // For code snippets
      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      
      const lines = item.content.split('\n');
      const lineHeight = 5;
      
      // Add a background for code with rounded corners
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(
        20, 
        yPos - 5, 
        doc.internal.pageSize.width - 40, 
        (lines.length * lineHeight) + 10, 
        3, 3, 
        'F'
      );
      
      // Check if we need a new page
      if (yPos + (lines.length * lineHeight) + 10 > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
        
        // Re-add the background on the new page
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(
          20, 
          yPos - 5, 
          doc.internal.pageSize.width - 40, 
          (lines.length * lineHeight) + 10, 
          3, 3, 
          'F'
        );
      }
      
      // Add code with syntax highlighting simulation
      doc.setTextColor(55, 65, 81);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if line would overflow page
        if (yPos + lineHeight > doc.internal.pageSize.height - 20) {
          doc.addPage();
          yPos = 20;
          
          // Re-add background for continued code
          if (i < lines.length - 1) {
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(
              20, 
              yPos - 5, 
              doc.internal.pageSize.width - 40, 
              ((lines.length - i) * lineHeight) + 10, 
              3, 3, 
              'F'
            );
          }
        }
        
        // Add line numbers for longer code blocks
        if (lines.length > 5) {
          doc.setTextColor(150, 150, 150);
          doc.text(`${i + 1}`, 23, yPos + 3);
          doc.setTextColor(55, 65, 81);
          doc.text(line, 35, yPos + 3);
        } else {
          doc.text(line, 25, yPos + 3);
        }
        
        yPos += lineHeight;
      }
      
      // Add a border around the code block
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(
        20, 
        yPos - (lines.length * lineHeight) - 5, 
        doc.internal.pageSize.width - 40, 
        (lines.length * lineHeight) + 10, 
        3, 3, 
        'S'
      );
      
      yPos += 10;
    }

    // Add caption if present
    if (item.caption) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(107, 114, 128);
      
      if (yPos > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      // Center the caption
      const textWidth = doc.getTextWidth(item.caption);
      const centerX = (doc.internal.pageSize.width - textWidth) / 2;
      
      // Add a background for the caption
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(
        centerX - 5, 
        yPos - 5, 
        textWidth + 10, 
        10, 
        2, 2, 
        'F'
      );
      
      doc.text(item.caption, centerX, yPos);
      
      yPos += 15;
    }
    
    // Add spacing between evidence items
    yPos += 10;
  }

  return yPos;
};

// Split content into smaller chunks to avoid rendering issues
const splitContentIntoChunks = (content: string, chunkSize: number): string[] => {
  // If content is small enough, return as is
  if (content.length <= chunkSize) {
    return [content];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  const paragraphs = content.split('\n\n');
  
  for (const paragraph of paragraphs) {
    // Special handling for tables - keep them in their own chunk
    if (paragraph.includes('|') && paragraph.includes('\n|')) {
      // If we have content in the current chunk, push it first
      if (currentChunk.trim()) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      // Add the table as its own chunk
      chunks.push(paragraph);
    } else {
      // If adding this paragraph would exceed chunk size, push current chunk and start a new one
      if (currentChunk.length + paragraph.length > chunkSize) {
        chunks.push(currentChunk);
        currentChunk = paragraph + '\n\n';
      } else {
        currentChunk += paragraph + '\n\n';
      }
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Function to add recommendations list
const addRecommendations = async (doc: jsPDF, recommendations: string[] | undefined, t: TFunction, startY: number = 30): Promise<number> => {
  let yPos = startY;
  
  // Check if recommendations exist
  if (!recommendations || recommendations.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(t('empty.recommendations'), 20, yPos);
    return yPos + 10;
  }
  
  // Add each recommendation as a bullet point
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  recommendations.forEach(rec => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(`• ${rec}`, 20, yPos);
    yPos += 10;
  });
  
  return yPos;
};

// Function to add findings to PDF
const addFindings = async (doc: jsPDF, findings: Finding[], t: TFunction, startY: number = 30): Promise<number> => {
  if (!findings || findings.length === 0) return startY;
  
  let yPos = startY;
  
  // Add findings summary table first
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  
  const summaryHeaders = [
    { header: t('form.title'), dataKey: 'title' },
    { header: t('form.severity'), dataKey: 'severity' }
  ];
  
  const summaryData = findings.map((finding, index) => ({
    title: `${index + 1}. ${finding.title}`,
    severity: t(`severity.${finding.severity.toLowerCase()}`)
  }));
  
  autoTable(doc, {
    head: [summaryHeaders.map(h => h.header)],
    body: summaryData.map(row => [row.title, row.severity]),
    startY: yPos,
    margin: { left: 20, right: 20 },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [55, 65, 81]
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  // Add detailed findings
  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    
    // Always start a new page for each finding
    if (i > 0) {
      doc.addPage();
      yPos = 20;
    }
    
    // Finding header with title and severity
    doc.setFillColor(241, 245, 249); // Light gray background
    doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 15, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${i + 1}. ${finding.title}`, 25, yPos + 4);
    
    // Add severity badge
    const severityColors: Record<string, [number, number, number]> = {
      'Critical': [239, 68, 68],
      'High': [249, 115, 22],
      'Medium': [245, 158, 11],
      'Low': [59, 130, 246],
      'Info': [107, 114, 128]
    };
    
    const severityColor = severityColors[finding.severity] || severityColors.Info;
    const translatedSeverity = t(`severity.${finding.severity.toLowerCase()}`);
    const titleWidth = doc.getTextWidth(`${i + 1}. ${finding.title}`);
    
    doc.setFillColor(...severityColor);
    doc.roundedRect(45 + titleWidth, yPos - 2, 30, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(translatedSeverity, 60 + titleWidth, yPos + 3, { align: 'center' });
    
    yPos += 20;
    
    // CVSS Score if available
    if (finding.cvss) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(`CVSS: ${finding.cvss.score.toFixed(1)} (${finding.cvss.vector})`, 25, yPos);
      yPos += 10;
    }
    
    // Description section
    yPos = await addFindingSection(doc, t('report.description'), finding.description, yPos);
    
    // Impact section
    yPos = await addFindingSection(doc, t('report.impact'), finding.impact, yPos);
    
    // Remediation section
    yPos = await addFindingSection(doc, t('report.remediation'), finding.remediation, yPos);
    
    // Evidence section
    if (finding.evidence && finding.evidence.length > 0) {
      doc.addPage();
      yPos = 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(t('report.evidence'), 20, yPos);
      yPos += 10;
      
      yPos = await addEvidence(doc, finding.evidence, t, yPos);
    }
  }
  
  return yPos;
};

// Helper function to add a section to a finding
const addFindingSection = async (doc: jsPDF, title: string, content: string, startY: number): Promise<number> => {
  let yPos = startY;
  
  // Check if we need a new page
  if (yPos > doc.internal.pageSize.height - 40) {
    doc.addPage();
    yPos = 20;
  }
  
  // Section title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title, 20, yPos);
  yPos += 8;
  
  // Section content
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  
  // Split content into smaller chunks to avoid memory issues
  const contentDiv = renderMarkdownForPDF(content);
  try {
    const canvas = await html2canvas(contentDiv, {
      scale: 1.5, // Reduced scale for better performance
      logging: false,
      useCORS: true,
      backgroundColor: 'white',
      width: doc.internal.pageSize.width - 40, // Match PDF width minus margins
      height: contentDiv.offsetHeight
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for better compression
    const imgWidth = doc.internal.pageSize.width - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Check if content needs a new page
    if (yPos + imgHeight > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add image with proper positioning
    doc.addImage(imgData, 'JPEG', 20, yPos, imgWidth, imgHeight, undefined, 'FAST');
    document.body.removeChild(contentDiv);
    
    yPos += imgHeight + 15;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    // Fallback to basic text rendering if html2canvas fails
    const lines = content.split('\n');
    doc.setFontSize(10);
    lines.forEach(line => {
      if (yPos > doc.internal.pageSize.height - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    document.body.removeChild(contentDiv);
  }
  
  return yPos;
};

// Function to add discoveries to PDF
const addDiscoveries = async (doc: jsPDF, discoveries: Discovery[], t: TFunction, startY: number = 30): Promise<number> => {
  if (!discoveries || discoveries.length === 0) return startY;
  
  let yPos = startY;
  
  for (let i = 0; i < discoveries.length; i++) {
    const discovery = discoveries[i];
    
    // Add discovery title and category
    if (yPos > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(13); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${i + 1}. ${discovery.title}`, 20, yPos);
    
    // Add category badge
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(doc.getTextWidth(`${i + 1}. ${discovery.title}`) + 25, yPos - 5, 40, 10, 2, 2, 'F');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.text(discovery.category, doc.getTextWidth(`${i + 1}. ${discovery.title}`) + 45, yPos, { align: 'center' });
    
    yPos += 20;
    
    // Add description
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(t('report.description'), 20, yPos);
    yPos += 10;
    
    yPos = await addMarkdownContent(doc, discovery.description, yPos);
    yPos += 10;
    
    // Add details
    if (yPos > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.text(t('report.details'), 20, yPos);
    yPos += 10;
    
    yPos = await addMarkdownContent(doc, discovery.details, yPos);
    yPos += 10;
    
    // Add evidence if available
    if (discovery.evidence && discovery.evidence.length > 0) {
      if (yPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos = await addEvidence(doc, discovery.evidence, t, yPos);
    }
    
    // Add page break between discoveries
    if (i < discoveries.length - 1) {
      doc.addPage();
      yPos = 20;
    }
  }
  
  return yPos;
};

// Function to create a professional cover page
const addCoverPage = async (doc: jsPDF, reportData: ReportData, t: TFunction): Promise<void> => {
  // Set background color
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');
  
  try {
    // Load and add logo
    const logoBase64 = getLogoBase64();
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          doc.addImage(
            img,
            'PNG',
            doc.internal.pageSize.width / 2 - 40,
            50,
            80,
            80
          );
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = logoBase64;
    });
  } catch (error) {
    console.error('Error adding logo to PDF:', error);
  }
  
  // Add report title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(t('report.title'), doc.internal.pageSize.width / 2, 160, { align: 'center' });
  
  // Add client and project name
  doc.setFontSize(18);
  doc.text(reportData.clientName, doc.internal.pageSize.width / 2, 190, { align: 'center' });
  doc.setFontSize(16);
  doc.text(reportData.projectName, doc.internal.pageSize.width / 2, 210, { align: 'center' });
  
  // Add testing period
  if (reportData.testingPeriod.startDate && reportData.testingPeriod.endDate) {
    doc.setFontSize(12);
    doc.text(
      `${t('report.testingPeriod')}: ${reportData.testingPeriod.startDate} - ${reportData.testingPeriod.endDate}`,
      doc.internal.pageSize.width / 2,
      230,
      { align: 'center' }
    );
  }
  
  // Add company info at the bottom
  doc.setFontSize(10);
  doc.text('Sunset Security', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 30, { align: 'center' });
  doc.text('Professional Penetration Testing Services', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
};

// Function to add page numbers
const addPageNumbers = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    if (i > 1) { // Skip page number on cover page
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      const text = `${i} / ${pageCount}`;
      const textWidth = doc.getTextWidth(text);
      doc.text(
        text,
        doc.internal.pageSize.width - textWidth - 10,
        doc.internal.pageSize.height - 10
      );
    }
  }
};

export const exportToPDF = async (reportData: ReportData, t: TFunction) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Enable compression to reduce file size
    });
    
    // Set higher quality options
    doc.setProperties({
      title: `${reportData.clientName} - ${reportData.projectName}`,
      subject: 'Penetration Test Report',
      author: 'Sunset Security',
      creator: 'Pentest Report Generator',
      keywords: 'pentest, security',
    });
    
    // Cover page
    await addCoverPage(doc, reportData, t);
    
    // Table of contents
    doc.addPage();
    let yPos = 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(t('report.tableOfContents'), 20, yPos);
    yPos += 15;
    
    // Get page counts
    const findingsPages = Math.max(1, reportData.findings.length);
    const discoveriesPages = Math.max(1, reportData.discoveries.length);
    
    // Add TOC entries
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    
    const tocItems = [
      { title: t('report.executiveSummary'), page: 3 },
      { title: t('report.scope'), page: 4 },
      { title: t('report.methodology'), page: 5 },
      { title: t('report.findings'), page: 6 },
      { title: t('report.discoveries'), page: 6 + findingsPages },
      { title: t('report.conclusion'), page: 6 + findingsPages + discoveriesPages }
    ];
    
    // Only include recommendations if they exist
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      tocItems.splice(1, 0, { title: t('report.recommendations'), page: 4 });
      // Adjust all subsequent page numbers
      for (let i = 2; i < tocItems.length; i++) {
        tocItems[i].page += 1;
      }
    }
    
    // Display TOC
    tocItems.forEach(item => {
      doc.text(item.title, 20, yPos);
      doc.text(item.page.toString(), 180, yPos);
      yPos += 10;
    });
    
    // Executive Summary
    doc.addPage();
    yPos = addSectionTitle(doc, t('report.executiveSummary'));
    yPos = await addMarkdownContent(doc, reportData.executiveSummary || t('empty.executiveSummary'), yPos);
    
    // Recommendations (only if they exist)
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      doc.addPage();
      yPos = addSectionTitle(doc, t('report.recommendations'));
      yPos = await addRecommendations(doc, reportData.recommendations, t, yPos);
    }
    
    // Scope
    doc.addPage();
    yPos = addSectionTitle(doc, t('report.scope'));
    yPos = await addMarkdownContent(doc, reportData.scope || t('empty.scope'), yPos);
    
    // Methodology
    doc.addPage();
    yPos = addSectionTitle(doc, t('report.methodology'));
    yPos = await addMarkdownContent(doc, reportData.methodology || t('empty.methodology'), yPos);
    
    // Findings
    doc.addPage();
    yPos = addSectionTitle(doc, t('report.findings'));
    
    if (reportData.findings && reportData.findings.length > 0) {
      // Findings summary table
      const headerRow = ['#', t('form.title'), t('form.severity')];
      const bodyRows = reportData.findings.map((finding, index) => [
        (index + 1).toString(),
        finding.title,
        t(`severity.${finding.severity.toLowerCase()}`)
      ]);
      
      autoTable(doc, {
        head: [headerRow],
        body: bodyRows,
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: [229, 231, 235],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 }
        }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // Individual findings with page breaks
      for (let i = 0; i < reportData.findings.length; i++) {
        doc.addPage();
        const finding = reportData.findings[i];
        
        // Finding header with background
        yPos = 20;
        doc.setFillColor(229, 231, 235);
        doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 12, 'F');
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${finding.title}`, 25, yPos + 3);
        yPos += 15;
        
        // Severity
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${t('form.severity')}: ${t(`severity.${finding.severity.toLowerCase()}`)}`, 20, yPos);
        yPos += 10;
        
        // CVSS if available
        if (finding.cvss) {
          doc.setFont('helvetica', 'normal');
          doc.text(`CVSS: ${finding.cvss.score.toFixed(1)} (${finding.cvss.vector})`, 20, yPos);
          yPos += 10;
        }
        
        // Description
        doc.setFont('helvetica', 'bold');
        doc.text(t('report.description'), 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        yPos = await addMarkdownContent(doc, finding.description, yPos);
        
        // Impact
        doc.setFont('helvetica', 'bold');
        doc.text(t('report.impact'), 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        yPos = await addMarkdownContent(doc, finding.impact, yPos);
        
        // Remediation
        doc.setFont('helvetica', 'bold');
        doc.text(t('report.remediation'), 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        yPos = await addMarkdownContent(doc, finding.remediation, yPos);
        
        // Evidence
        if (finding.evidence && finding.evidence.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(t('report.evidence'), 20, yPos);
          yPos += 10;
          yPos = await addEvidence(doc, finding.evidence, t, yPos);
        }
      }
    } else {
      // No findings
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(t('empty.findings'), 20, yPos);
      yPos += 10;
    }
    
    // Discoveries
    doc.addPage();
    yPos = addSectionTitle(doc, t('report.discoveries'));
    
    if (reportData.discoveries && reportData.discoveries.length > 0) {
      // For each discovery
      for (let i = 0; i < reportData.discoveries.length; i++) {
        if (i > 0) {
          doc.addPage();
          yPos = 20;
        }
        
        const discovery = reportData.discoveries[i];
        
        // Discovery header with background
        doc.setFillColor(229, 231, 235);
        doc.rect(20, yPos - 5, doc.internal.pageSize.width - 40, 12, 'F');
        
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(discovery.title, 25, yPos + 3);
        yPos += 15;
        
        // Category
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${t('discovery.category')}: ${discovery.category}`, 20, yPos);
        yPos += 10;
        
        // Description
        doc.setFont('helvetica', 'bold');
        doc.text(t('report.description'), 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        yPos = await addMarkdownContent(doc, discovery.description, yPos);
        
        // Details
        doc.setFont('helvetica', 'bold');
        doc.text(t('discovery.details'), 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        yPos = await addMarkdownContent(doc, discovery.details, yPos);
        
        // Evidence
        if (discovery.evidence && discovery.evidence.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text(t('report.evidence'), 20, yPos);
          yPos += 10;
          yPos = await addEvidence(doc, discovery.evidence, t, yPos);
        }
      }
    } else {
      // No discoveries
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(t('empty.discoveries'), 20, yPos);
      yPos += 10;
    }
    
    // Conclusion
    doc.addPage();
    yPos = addSectionTitle(doc, t('report.conclusion'));
    await addMarkdownContent(doc, reportData.conclusion || t('empty.conclusion'), yPos);
    
    // Add page numbers
    addPageNumbers(doc);
    
    // Save the PDF
    const sanitizedClientName = reportData.clientName.replace(/[^a-z0-9]/gi, '_');
    const sanitizedProjectName = reportData.projectName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Use standard save without compression options
    doc.save(`${sanitizedClientName}_${sanitizedProjectName}_${timestamp}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Add function to handle markdown export
export const exportToMarkdown = async (reportData: ReportData, t: TFunction): Promise<string> => {
  let markdown = '';
  
  // Title and Client Info
  markdown += `# ${reportData.clientName}\n`;
  markdown += `## ${reportData.projectName}\n\n`;
  
  if (reportData.testingPeriod.startDate && reportData.testingPeriod.endDate) {
    markdown += `**${t('report.testingPeriod')}:** ${reportData.testingPeriod.startDate} - ${reportData.testingPeriod.endDate}\n\n`;
  }
  
  // Executive Summary
  markdown += `## ${t('report.executiveSummary')}\n\n`;
  markdown += `${reportData.executiveSummary || t('empty.executiveSummary')}\n\n`;
  
  // Recommendations
  markdown += `## ${t('report.recommendations')}\n\n`;
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    reportData.recommendations.forEach(rec => {
      markdown += `- ${rec}\n`;
    });
  } else {
    markdown += t('empty.recommendations') + '\n';
  }
  markdown += '\n';
  
  // Methodology
  markdown += `## ${t('report.methodology')}\n\n`;
  markdown += `${reportData.methodology || t('empty.methodology')}\n\n`;
  
  // Scope
  markdown += `## ${t('report.scope')}\n\n`;
  markdown += `${reportData.scope || t('empty.scope')}\n\n`;
  
  // Findings
  markdown += `## ${t('report.findings')}\n\n`;
  if (reportData.findings && reportData.findings.length > 0) {
    reportData.findings.forEach((finding, index) => {
      markdown += `### ${index + 1}. ${finding.title}\n\n`;
      markdown += `**${t('form.severity')}:** ${finding.severity}\n\n`;
      markdown += `#### ${t('report.description')}\n${finding.description}\n\n`;
      markdown += `#### ${t('report.impact')}\n${finding.impact}\n\n`;
      markdown += `#### ${t('report.remediation')}\n${finding.remediation}\n\n`;
      
      if (finding.evidence && finding.evidence.length > 0) {
        markdown += `#### ${t('report.evidence')}\n\n`;
        finding.evidence.forEach(item => {
          if (item.type === 'image') {
            // Create an 'evidence' folder and save images there
            const filename = `evidence/${item.id}.jpg`;
            markdown += `![${item.title}](${filename})\n\n`;
            if (item.caption) {
              markdown += `*${item.caption}*\n\n`;
            }
          } else {
            markdown += `\`\`\`${item.language || ''}\n${item.content}\n\`\`\`\n\n`;
            if (item.caption) {
              markdown += `*${item.caption}*\n\n`;
            }
          }
        });
      }
      markdown += '---\n\n';
    });
  } else {
    markdown += t('empty.findings') + '\n\n';
  }
  
  // Discoveries
  markdown += `## ${t('report.discoveries')}\n\n`;
  if (reportData.discoveries && reportData.discoveries.length > 0) {
    reportData.discoveries.forEach(discovery => {
      markdown += `### ${discovery.title}\n\n`;
      markdown += `**${t('discovery.category')}:** ${discovery.category}\n\n`;
      markdown += `#### ${t('report.description')}\n${discovery.description}\n\n`;
      markdown += `#### ${t('discovery.details')}\n${discovery.details}\n\n`;
      
      if (discovery.evidence && discovery.evidence.length > 0) {
        markdown += `#### ${t('report.evidence')}\n\n`;
        discovery.evidence.forEach(item => {
          if (item.type === 'image') {
            const filename = `evidence/${item.id}.jpg`;
            markdown += `![${item.title}](${filename})\n\n`;
            if (item.caption) {
              markdown += `*${item.caption}*\n\n`;
            }
          } else {
            markdown += `\`\`\`${item.language || ''}\n${item.content}\n\`\`\`\n\n`;
            if (item.caption) {
              markdown += `*${item.caption}*\n\n`;
            }
          }
        });
      }
      markdown += '---\n\n';
    });
  } else {
    markdown += t('empty.discoveries') + '\n\n';
  }
  
  // Conclusion
  markdown += `## ${t('report.conclusion')}\n\n`;
  markdown += `${reportData.conclusion || t('empty.conclusion')}\n`;
  
  return markdown;
};

// Add this after the saveMarkdownWithImages function
const createReadme = (t: TFunction): string => {
  return `# How to Use This Export

This ZIP file contains your pentest report in markdown format, along with all associated images.

## Contents

- \`report.md\` - The main report in markdown format
- \`evidence/\` - Directory containing all images referenced in the report

## Viewing the Report

1. Extract all files from the ZIP archive to a folder
2. The markdown file can be viewed in:
   - VS Code (with markdown preview)
   - Any markdown editor that supports local images
   - GitHub/GitLab (if you push it to a repository)

## Converting to Other Formats

You can convert this markdown to other formats using tools like Pandoc:

\`\`\`bash
# Convert to PDF
pandoc report.md -o report.pdf

# Convert to HTML
pandoc report.md -o report.html

# Convert to Word Document
pandoc report.md -o report.docx
\`\`\`

## Image References

All images are stored in the \`evidence/\` directory and are referenced using relative paths in the markdown file. As long as you keep the directory structure intact, the images will display correctly.`;
};

export const saveMarkdownWithImages = async (reportData: ReportData, t: TFunction): Promise<void> => {
  try {
    // Generate markdown content
    const markdown = await exportToMarkdown(reportData, t);
    
    // Create a zip file
    const zip = new JSZip();
    
    // Add markdown file
    zip.file('report.md', markdown);
    
    // Add README
    zip.file('README.md', createReadme(t));
    
    // Create evidence folder in zip
    const evidenceFolder = zip.folder('evidence');
    if (!evidenceFolder) {
      throw new Error('Failed to create evidence folder in ZIP');
    }
    
    // Process all images from findings and discoveries
    const processImages = async () => {
      // Process findings
      for (const finding of reportData.findings) {
        if (finding.evidence) {
          for (const item of finding.evidence) {
            if (item.type === 'image') {
              try {
                // Convert and compress image
                const compressedImage = await compressImage(item.content);
                evidenceFolder.file(`${item.id}.jpg`, compressedImage.split(',')[1], { base64: true });
              } catch (error) {
                console.error(`Error processing image ${item.id}:`, error);
              }
            }
          }
        }
      }
      
      // Process discoveries
      for (const discovery of reportData.discoveries) {
        if (discovery.evidence) {
          for (const item of discovery.evidence) {
            if (item.type === 'image') {
              try {
                // Convert and compress image
                const compressedImage = await compressImage(item.content);
                evidenceFolder.file(`${item.id}.jpg`, compressedImage.split(',')[1], { base64: true });
              } catch (error) {
                console.error(`Error processing image ${item.id}:`, error);
              }
            }
          }
        }
      }
    };
    
    await processImages();
    
    // Generate zip file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportData.clientName}_${reportData.projectName}_Report.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error saving markdown with images:', error);
    throw error;
  }
};

// Helper function to compress images
const compressImage = async (dataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Max dimensions
      const maxWidth = 1200;
      const maxHeight = 1200;
      
      // Resize if needed
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}; 