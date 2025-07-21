import { jsPDF } from 'jspdf';
import { ReportData } from '../types/reportTypes';
import { TFunction } from 'i18next';

interface PDFExportOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

// Generate findings-by-severity summary
const generateFindingsSummary = (findings: any[]): { severity: string; count: number; color: number[] }[] => {
  // Count findings by severity
  const severityCounts = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Info: 0
  };

  findings.forEach(finding => {
    if (finding.severity && severityCounts.hasOwnProperty(finding.severity)) {
      severityCounts[finding.severity as keyof typeof severityCounts]++;
    }
  });

  // Return data with colors for PDF rendering
  return [
    { severity: 'Critical', count: severityCounts.Critical, color: [220, 53, 69] },
    { severity: 'High', count: severityCounts.High, color: [255, 193, 7] },
    { severity: 'Medium', count: severityCounts.Medium, color: [255, 152, 0] },
    { severity: 'Low', count: severityCounts.Low, color: [40, 167, 69] },
    { severity: 'Info', count: severityCounts.Info, color: [108, 117, 125] }
  ].filter(item => item.count > 0);
};

// Markdown parser for PDF rendering
const parseMarkdownForPDF = (markdown: string): Array<{ type: string; content: string; level?: number }> => {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const elements: Array<{ type: string; content: string; level?: number }> = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      elements.push({ type: 'empty', content: '' });
      continue;
    }
    
    // Headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const content = line.replace(/^#+\s*/, '');
      elements.push({ type: 'header', content, level });
      continue;
    }
    
    // Lists
    if (line.match(/^[\s]*[-*+]\s/)) {
      const content = line.replace(/^[\s]*[-*+]\s/, '');
      elements.push({ type: 'list-item', content });
      continue;
    }
    
    // Numbered lists
    if (line.match(/^[\s]*\d+\.\s/)) {
      const content = line.replace(/^[\s]*\d+\.\s/, '');
      elements.push({ type: 'list-item', content });
      continue;
    }
    
    // Code blocks
    if (line.startsWith('```')) {
      let codeContent = '';
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeContent += lines[i] + '\n';
        i++;
      }
      elements.push({ type: 'code-block', content: codeContent.trim() });
      continue;
    }
    
    // Inline code
    if (line.includes('`')) {
      const parts = line.split('`');
      for (let j = 0; j < parts.length; j++) {
        if (j % 2 === 0) {
          if (parts[j]) elements.push({ type: 'text', content: parts[j] });
        } else {
          elements.push({ type: 'inline-code', content: parts[j] });
        }
      }
      continue;
    }
    
    // Bold and italic
    let processedLine = line;
    const boldMatches = line.match(/\*\*(.*?)\*\*/g);
    if (boldMatches) {
      boldMatches.forEach(match => {
        const content = match.replace(/\*\*/g, '');
        processedLine = processedLine.replace(match, `__BOLD__${content}__/BOLD__`);
      });
    }
    
    const italicMatches = line.match(/\*(.*?)\*/g);
    if (italicMatches) {
      italicMatches.forEach(match => {
        const content = match.replace(/\*/g, '');
        processedLine = processedLine.replace(match, `__ITALIC__${content}__/ITALIC__`);
      });
    }
    
    // Links
    const linkMatches = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (linkMatches) {
      linkMatches.forEach(match => {
        const textMatch = match.match(/\[([^\]]+)\]/);
        const urlMatch = match.match(/\(([^)]+)\)/);
        if (textMatch && urlMatch) {
          processedLine = processedLine.replace(match, `${textMatch[1]} (${urlMatch[1]})`);
        }
      });
    }
    
    elements.push({ type: 'text', content: processedLine });
  }
  
  return elements;
};

// Render markdown elements to PDF
const renderMarkdownToPDF = (pdf: jsPDF, elements: Array<{ type: string; content: string; level?: number }>, y: number, maxWidth: number): number => {
  let currentY = y;
  
  for (const element of elements) {
    switch (element.type) {
      case 'header':
        const fontSize = element.level === 1 ? 16 : element.level === 2 ? 14 : 12;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        const headerLines = pdf.splitTextToSize(element.content, maxWidth);
        pdf.text(headerLines, 20, currentY);
        currentY += headerLines.length * fontSize * 0.4 + 2;
        pdf.setFont('helvetica', 'normal');
        break;
        
      case 'list-item':
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const listText = `• ${element.content}`;
        const listLines = pdf.splitTextToSize(listText, maxWidth - 10);
        pdf.text(listLines, 25, currentY);
        currentY += listLines.length * 10 * 0.4 + 1;
        break;
        
      case 'code-block':
        // Code block with background
        pdf.setFillColor(248, 249, 250);
        const codeLines = pdf.splitTextToSize(element.content, maxWidth - 10);
        const codeHeight = codeLines.length * 9 * 0.4 + 4;
        pdf.rect(20, currentY - 2, maxWidth, codeHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, currentY - 2, maxWidth, codeHeight, 'S');
        pdf.setFontSize(9);
        pdf.setFont('courier', 'normal');
        pdf.text(codeLines, 25, currentY);
        currentY += codeHeight + 2;
        pdf.setFont('helvetica', 'normal');
        break;
        
      case 'inline-code':
        pdf.setFontSize(9);
        pdf.setFont('courier', 'normal');
        pdf.setFillColor(248, 249, 250);
        const codeWidth = pdf.getTextWidth(element.content) + 4;
        pdf.rect(20, currentY - 1, codeWidth, 6, 'F');
        pdf.text(element.content, 22, currentY + 3);
        pdf.setFont('helvetica', 'normal');
        break;
        
      case 'text':
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Process bold and italic markers
        let text = element.content;
        const boldRegex = /__BOLD__(.*?)__\/BOLD__/g;
        const italicRegex = /__ITALIC__(.*?)__\/ITALIC__/g;
        
        let boldMatch;
        while ((boldMatch = boldRegex.exec(text)) !== null) {
          const boldText = boldMatch[1];
          const beforeBold = text.substring(0, boldMatch.index);
          const afterBold = text.substring(boldMatch.index + boldMatch[0].length);
          
          // Render text before bold
          if (beforeBold) {
            const beforeLines = pdf.splitTextToSize(beforeBold, maxWidth);
            pdf.text(beforeLines, 20, currentY);
            currentY += beforeLines.length * 10 * 0.4;
          }
          
          // Render bold text
          pdf.setFont('helvetica', 'bold');
          const boldLines = pdf.splitTextToSize(boldText, maxWidth);
          pdf.text(boldLines, 20, currentY);
          currentY += boldLines.length * 10 * 0.4;
          pdf.setFont('helvetica', 'normal');
          
          text = afterBold;
          boldRegex.lastIndex = 0; // Reset regex
        }
        
        let italicMatch;
        while ((italicMatch = italicRegex.exec(text)) !== null) {
          const italicText = italicMatch[1];
          const beforeItalic = text.substring(0, italicMatch.index);
          const afterItalic = text.substring(italicMatch.index + italicMatch[0].length);
          
          // Render text before italic
          if (beforeItalic) {
            const beforeLines = pdf.splitTextToSize(beforeItalic, maxWidth);
            pdf.text(beforeLines, 20, currentY);
            currentY += beforeLines.length * 10 * 0.4;
          }
          
          // Render italic text
          pdf.setFont('helvetica', 'italic');
          const italicLines = pdf.splitTextToSize(italicText, maxWidth);
          pdf.text(italicLines, 20, currentY);
          currentY += italicLines.length * 10 * 0.4;
          pdf.setFont('helvetica', 'normal');
          
          text = afterItalic;
          italicRegex.lastIndex = 0; // Reset regex
        }
        
        // Render remaining text
        if (text) {
          const textLines = pdf.splitTextToSize(text, maxWidth);
          pdf.text(textLines, 20, currentY);
          currentY += textLines.length * 10 * 0.4;
        }
        break;
        
      case 'empty':
        currentY += 3;
        break;
    }
  }
  
  return currentY;
};

export const exportToPDF = async (
  reportData: ReportData,
  t: TFunction,
  options: PDFExportOptions = {}
): Promise<void> => {
  const {
    format = 'a4',
    orientation = 'portrait'
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: true
    });

    pdf.setProperties({
      title: `${reportData.clientName} - ${reportData.projectName}`,
      subject: 'Penetration Test Report',
      author: 'Sunset Security',
      creator: 'Pentest Report Generator',
      keywords: 'pentest, security, report',
    });

    // 1. Professional Cover Page
    addCoverPage(pdf, reportData);
    pdf.addPage();

    // 2. Main Content
    generatePDFContent(pdf, reportData, t);

    // Save the PDF
    const fileName = `${reportData.clientName}_${reportData.projectName}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

function addCoverPage(pdf: jsPDF, reportData: ReportData) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;
  let y = 40;

  // Background color band
  pdf.setFillColor(51, 122, 183);
  pdf.rect(0, 0, pageWidth, 60, 'F');

  // Logo (centered)
  if (reportData.logo) {
    try {
      pdf.addImage(reportData.logo, 'PNG', centerX - 30, y - 30, 60, 60, undefined, 'FAST');
      y += 40;
    } catch (e) {
      // fallback: skip logo if invalid
      y += 20;
    }
  } else {
    // Default logo: white circle
    pdf.setFillColor(255, 255, 255);
    pdf.circle(centerX, y, 18, 'F');
    y += 40;
  }

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(51, 122, 183);
  pdf.text('Penetration Test Report', centerX, y, { align: 'center' });
  y += 18;

  // Subtitle/tagline
  if (reportData.coverPage?.subtitle) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(16);
    pdf.setTextColor(80, 80, 80);
    pdf.text(reportData.coverPage.subtitle, centerX, y, { align: 'center' });
    y += 12;
  }
  if (reportData.coverPage?.tagline) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(12);
    pdf.setTextColor(120, 120, 120);
    pdf.text(reportData.coverPage.tagline, centerX, y, { align: 'center' });
    y += 10;
  }

  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text(reportData.clientName || 'Client Name', centerX, y, { align: 'center' });
  y += 10;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text(reportData.projectName || 'Project Name', centerX, y, { align: 'center' });
  y += 10;

  // Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  const date = reportData.coverPage?.date || new Date().toLocaleDateString();
  pdf.text(date, centerX, y, { align: 'center' });

  // Footer branding
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Generated by Sunset Security', centerX, pageHeight - 20, { align: 'center' });
  pdf.setTextColor(0, 0, 0);
}

const generatePDFContent = (pdf: jsPDF, reportData: ReportData, t: TFunction) => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, fontSize: number, y: number, maxWidth: number = contentWidth): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, margin, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to add section title with styling
  const addSectionTitle = (title: string, y: number): number => {
    // Add background rectangle with border
    pdf.setFillColor(51, 122, 183); // Blue background
    pdf.rect(margin - 2, y - 2, contentWidth + 4, 14, 'F');
    
    // Add border
    pdf.setDrawColor(40, 96, 144); // Darker blue border
    pdf.setLineWidth(0.5);
    pdf.rect(margin - 2, y - 2, contentWidth + 4, 14, 'S');
    
    // Add title text
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text(title, margin, y + 9);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    y += 18;
    
    pdf.setFont('helvetica', 'normal');
    return y;
  };

  // Helper function to add severity badge
  const addSeverityBadge = (severity: string, x: number, y: number): number => {
    const colors = {
      'Critical': [220, 53, 69], // Red
      'High': [255, 193, 7],     // Yellow
      'Medium': [255, 152, 0],   // Orange
      'Low': [40, 167, 69],      // Green
      'Info': [108, 117, 125]    // Gray
    };
    
    const color = colors[severity as keyof typeof colors] || colors['Info'];
    const badgeWidth = 28;
    const badgeHeight = 10;
    
    // Add border
    pdf.setDrawColor(color[0], color[1], color[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y - 2, badgeWidth, badgeHeight, 'S');
    
    // Fill background
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(x + 0.5, y - 1.5, badgeWidth - 1, badgeHeight - 1, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(severity.substring(0, 3).toUpperCase(), x + 3, y + 4);
    pdf.setTextColor(0, 0, 0);
    
    return x + badgeWidth + 5;
  };

  // Helper function to add finding with professional styling
  const addFinding = (finding: any, index: number, y: number): number => {
    // Finding header with background and border
    pdf.setFillColor(248, 249, 250); // Light gray background
    pdf.rect(margin, y - 2, contentWidth, 14, 'F');
    
    // Add border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y - 2, contentWidth, 14, 'S');
    
    // Finding title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const findingTitle = `${index + 1}. ${finding.title || 'Untitled Finding'}`;
    pdf.text(findingTitle, margin + 3, y + 7);
    
    // Severity badge
    const badgeX = addSeverityBadge(finding.severity, pageWidth - margin - 35, y);
    y += 18;

    // CVSS info in a styled box
    if (finding.cvss) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y, contentWidth, 8, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const cvssText = `CVSS Score: ${finding.cvss.score.toFixed(1)} | Vector: ${finding.cvss.vector}`;
      pdf.text(cvssText, margin + 2, y + 6);
      y += 12;
    }

    // Description
    if (finding.description) {
      y = addSectionTitle('Description', y);
      const descElements = parseMarkdownForPDF(finding.description);
      y = renderMarkdownToPDF(pdf, descElements, y, contentWidth);
      y += 6;
    }

    // Impact
    if (finding.impact) {
      y = addSectionTitle('Impact', y);
      const impactElements = parseMarkdownForPDF(finding.impact);
      y = renderMarkdownToPDF(pdf, impactElements, y, contentWidth);
      y += 6;
    }

    // Remediation
    if (finding.remediation) {
      y = addSectionTitle('Remediation', y);
      const remediationElements = parseMarkdownForPDF(finding.remediation);
      y = renderMarkdownToPDF(pdf, remediationElements, y, contentWidth);
      y += 6;
    }

    // Evidence
    if (finding.evidence && finding.evidence.length > 0) {
      y = addSectionTitle('Evidence', y);
      finding.evidence.forEach((evidence: any) => {
        // Evidence header
        pdf.setFillColor(52, 58, 64);
        pdf.rect(margin, y, contentWidth, 8, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(evidence.title, margin + 2, y + 6);
        pdf.setTextColor(0, 0, 0);
        y += 10;
        
        // Evidence content
        pdf.setFont('helvetica', 'normal');
        if (evidence.type === 'text') {
          pdf.setFillColor(248, 249, 250);
          pdf.rect(margin, y, contentWidth, 0, 'F');
          y = addWrappedText(evidence.content, 9, y + 2);
        } else {
          pdf.text(`[Image: ${evidence.title}]`, margin + 2, y);
        }
        y += 4;
        
        if (evidence.caption) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'italic');
          pdf.text(evidence.caption, margin + 2, y);
          y += 4;
          pdf.setFont('helvetica', 'normal');
        }
        y += 4;
      });
    }

    y += 8;
    return y;
  };

  // Helper function to add table
  const addTable = (headers: string[], data: string[][], y: number): number => {
    const colWidth = contentWidth / headers.length;
    const rowHeight = 10;
    
    // Table header with border
    pdf.setFillColor(52, 58, 64);
    pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    pdf.setDrawColor(52, 58, 64);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, y, contentWidth, rowHeight, 'S');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    
    headers.forEach((header, index) => {
      pdf.text(header, margin + (index * colWidth) + 4, y + 7);
      // Add vertical borders between columns
      if (index < headers.length - 1) {
        pdf.line(margin + (index + 1) * colWidth, y, margin + (index + 1) * colWidth, y + rowHeight);
      }
    });
    
    y += rowHeight;
    pdf.setTextColor(0, 0, 0);
    
    // Table data with alternating colors and borders
    data.forEach((row, rowIndex) => {
      const bgColor = rowIndex % 2 === 0 ? [240, 240, 240] : [255, 255, 255]; // Grey and white alternating
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
      
      // Add border around each row
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, y, contentWidth, rowHeight, 'S');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      row.forEach((cell, colIndex) => {
        const lines = pdf.splitTextToSize(cell, colWidth - 8);
        pdf.text(lines, margin + (colIndex * colWidth) + 4, y + 7);
        // Add vertical borders between columns
        if (colIndex < row.length - 1) {
          pdf.line(margin + (colIndex + 1) * colWidth, y, margin + (colIndex + 1) * colWidth, y + rowHeight);
        }
      });
      
      y += rowHeight;
    });
    
    return y + 6;
  };

  // Professional header with logo and styling
  pdf.setFillColor(51, 122, 183);
  pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 25, 'F');
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Sunset Security', margin + 5, yPosition + 8);
  
  // Add a simple logo element
  pdf.setFillColor(255, 255, 255);
  pdf.circle(margin + 2, yPosition + 8, 3, 'F');
  
  yPosition += 30;

  // Report title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(reportData.clientName || 'Client Name', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(14);
  pdf.text(reportData.projectName || 'Project Name', margin, yPosition);
  yPosition += 8;

  // Testing period in a styled box
  if (reportData.testingPeriod.startDate && reportData.testingPeriod.endDate) {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const periodText = `Testing Period: ${new Date(reportData.testingPeriod.startDate).toLocaleDateString()} - ${new Date(reportData.testingPeriod.endDate).toLocaleDateString()}`;
    pdf.text(periodText, margin + 2, yPosition + 6);
    yPosition += 12;
  }

  yPosition += 8;

  // Executive Summary
  if (reportData.executiveSummary) {
    yPosition = addSectionTitle('Executive Summary', yPosition);
    const executiveElements = parseMarkdownForPDF(reportData.executiveSummary);
    yPosition = renderMarkdownToPDF(pdf, executiveElements, yPosition, contentWidth);
    yPosition += 8;

    // Add findings summary if there are findings
    if (reportData.findings && reportData.findings.length > 0) {
      const findingsSummary = generateFindingsSummary(reportData.findings);
      if (findingsSummary.length > 0) {
        // Add summary title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Vulnerability Summary', margin, yPosition);
        yPosition += 8;
        
        // Create simple bar chart
        const chartWidth = contentWidth;
        const chartHeight = 60;
        const barWidth = chartWidth / findingsSummary.length;
        const maxCount = Math.max(...findingsSummary.map(f => f.count));
        
        // Draw chart background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(margin, yPosition, chartWidth, chartHeight, 'F');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPosition, chartWidth, chartHeight, 'S');
        
        // Draw bars
        findingsSummary.forEach((item, index) => {
          const barHeight = maxCount > 0 ? (item.count / maxCount) * (chartHeight - 20) : 0;
          const barX = margin + (index * barWidth) + 5;
          const barY = yPosition + chartHeight - barHeight - 10;
          
          // Draw bar
          pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
          pdf.rect(barX, barY, barWidth - 10, barHeight, 'F');
          
          // Draw count on bar
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(item.count.toString(), barX + (barWidth - 10) / 2, barY + barHeight / 2, { align: 'center' });
          
          // Draw severity label below bar
          pdf.setFontSize(8);
          pdf.setTextColor(0, 0, 0);
          pdf.text(item.severity, barX + (barWidth - 10) / 2, yPosition + chartHeight + 5, { align: 'center' });
        });
        
        yPosition += chartHeight + 20;
      }
    }
  }

  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    yPosition = addSectionTitle('Recommendations', yPosition);
    reportData.recommendations.forEach((rec, index) => {
      const recText = `${index + 1}. ${rec}`;
      const recElements = parseMarkdownForPDF(recText);
      yPosition = renderMarkdownToPDF(pdf, recElements, yPosition, contentWidth);
    });
    yPosition += 8;
  }

  // Scope
  if (reportData.scope) {
    yPosition = addSectionTitle('Scope', yPosition);
    const scopeElements = parseMarkdownForPDF(reportData.scope);
    yPosition = renderMarkdownToPDF(pdf, scopeElements, yPosition, contentWidth);
    yPosition += 8;
  }

  // Methodology
  if (reportData.methodology) {
    yPosition = addSectionTitle('Methodology', yPosition);
    const methodologyElements = parseMarkdownForPDF(reportData.methodology);
    yPosition = renderMarkdownToPDF(pdf, methodologyElements, yPosition, contentWidth);
    yPosition += 8;
  }

  // Findings
  if (reportData.findings && reportData.findings.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition = addSectionTitle('Findings', yPosition);
    
    // Add findings summary table
    const findingsHeaders = ['#', 'Finding', 'Severity', 'CVSS'];
    const findingsData = reportData.findings.map((finding, index) => [
      (index + 1).toString(),
      finding.title || 'Untitled',
      finding.severity,
      finding.cvss ? finding.cvss.score.toFixed(1) : 'N/A'
    ]);
    
    yPosition = addTable(findingsHeaders, findingsData, yPosition);
    yPosition += 8;
    
    // Detailed findings
    reportData.findings.forEach((finding, index) => {
      // Check if we need a new page for this finding
      if (yPosition > pageHeight - 200) {
        pdf.addPage();
        yPosition = margin;
      }
      
      yPosition = addFinding(finding, index, yPosition);
    });
  }

  // Discoveries
  if (reportData.discoveries && reportData.discoveries.length > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition = addSectionTitle('Discoveries', yPosition);
    
    reportData.discoveries.forEach((discovery) => {
      // Check if we need a new page for this discovery
      if (yPosition > pageHeight - 150) {
        pdf.addPage();
        yPosition = margin;
      }

      // Discovery header with styling
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, yPosition - 2, contentWidth, 12, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(discovery.title || 'Untitled Discovery', margin + 2, yPosition + 6);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Category: ${discovery.category}`, margin + 2, yPosition + 16);
      yPosition += 20;

      // Description
      if (discovery.description) {
        yPosition = addSectionTitle('Description', yPosition);
        const discoveryDescElements = parseMarkdownForPDF(discovery.description);
        yPosition = renderMarkdownToPDF(pdf, discoveryDescElements, yPosition, contentWidth);
        yPosition += 6;
      }

      // Details
      if (discovery.details) {
        yPosition = addSectionTitle('Details', yPosition);
        const discoveryDetailsElements = parseMarkdownForPDF(discovery.details);
        yPosition = renderMarkdownToPDF(pdf, discoveryDetailsElements, yPosition, contentWidth);
        yPosition += 6;
      }

      // Evidence
      if (discovery.evidence && discovery.evidence.length > 0) {
        yPosition = addSectionTitle('Evidence', yPosition);
        discovery.evidence.forEach((evidence: any) => {
          // Evidence header
          pdf.setFillColor(52, 58, 64);
          pdf.rect(margin, yPosition, contentWidth, 8, 'F');
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text(evidence.title, margin + 2, yPosition + 6);
          pdf.setTextColor(0, 0, 0);
          yPosition += 10;
          
          // Evidence content
          pdf.setFont('helvetica', 'normal');
          if (evidence.type === 'text') {
            pdf.setFillColor(248, 249, 250);
            pdf.rect(margin, yPosition, contentWidth, 0, 'F');
            const evidenceElements = parseMarkdownForPDF(evidence.content);
            yPosition = renderMarkdownToPDF(pdf, evidenceElements, yPosition + 2, contentWidth);
          } else {
            pdf.text(`[Image: ${evidence.title}]`, margin + 2, yPosition);
          }
          yPosition += 4;
          
          if (evidence.caption) {
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            pdf.text(evidence.caption, margin + 2, yPosition);
            yPosition += 4;
            pdf.setFont('helvetica', 'normal');
          }
          yPosition += 4;
        });
      }

      yPosition += 8;
    });
  }

  // Conclusion
  if (reportData.conclusion) {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition = addSectionTitle('Conclusion', yPosition);
    const conclusionElements = parseMarkdownForPDF(reportData.conclusion);
    yPosition = renderMarkdownToPDF(pdf, conclusionElements, yPosition, contentWidth);
  }

  // Footer
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Generated by Sunset Security - ${new Date().toLocaleDateString()}`, margin, footerY);
  pdf.text(`Page ${pdf.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, footerY);
};

export const exportToMarkdown = async (reportData: ReportData, t: TFunction): Promise<string> => {
  let markdown = '';

  // Header
  markdown += `# ${reportData.clientName || 'Client Name'}\n`;
  markdown += `## ${reportData.projectName || 'Project Name'}\n\n`;
  
  if (reportData.testingPeriod.startDate && reportData.testingPeriod.endDate) {
    markdown += `**Testing Period:** ${new Date(reportData.testingPeriod.startDate).toLocaleDateString()} - ${new Date(reportData.testingPeriod.endDate).toLocaleDateString()}\n\n`;
  }

  // Executive Summary
  if (reportData.executiveSummary) {
    markdown += `## Executive Summary\n\n${reportData.executiveSummary}\n\n`;
  }

  // Recommendations
  if (reportData.recommendations && reportData.recommendations.length > 0) {
    markdown += `## Recommendations\n\n`;
    reportData.recommendations.forEach((rec, index) => {
      markdown += `${index + 1}. ${rec}\n`;
    });
    markdown += '\n';
  }

  // Scope
  if (reportData.scope) {
    markdown += `## Scope\n\n${reportData.scope}\n\n`;
  }

  // Methodology
  if (reportData.methodology) {
    markdown += `## Methodology\n\n${reportData.methodology}\n\n`;
  }

  // Findings
  if (reportData.findings && reportData.findings.length > 0) {
    markdown += `## Findings\n\n`;
    reportData.findings.forEach((finding, index) => {
      markdown += `### ${index + 1}. ${finding.title || 'Untitled Finding'}\n\n`;
      markdown += `**Severity:** ${finding.severity}\n\n`;
      
      if (finding.cvss) {
        markdown += `**CVSS:** ${finding.cvss.score.toFixed(1)} (${finding.cvss.vector})\n\n`;
      }
      
      if (finding.description) {
        markdown += `#### Description\n\n${finding.description}\n\n`;
      }
      
      if (finding.impact) {
        markdown += `#### Impact\n\n${finding.impact}\n\n`;
      }
      
      if (finding.remediation) {
        markdown += `#### Remediation\n\n${finding.remediation}\n\n`;
      }
      
      if (finding.evidence && finding.evidence.length > 0) {
        markdown += `#### Evidence\n\n`;
        finding.evidence.forEach((evidence, evIndex) => {
          markdown += `**${evidence.title}**\n\n`;
          if (evidence.type === 'image') {
            markdown += `![${evidence.caption || evidence.title}](${evidence.content})\n\n`;
          } else {
            markdown += `\`\`\`${evidence.language || ''}\n${evidence.content}\n\`\`\`\n\n`;
          }
          if (evidence.caption) {
            markdown += `*${evidence.caption}*\n\n`;
          }
        });
      }
    });
  }

  // Discoveries
  if (reportData.discoveries && reportData.discoveries.length > 0) {
    markdown += `## Discoveries\n\n`;
    reportData.discoveries.forEach(discovery => {
      markdown += `### ${discovery.title || 'Untitled Discovery'}\n\n`;
      markdown += `**Category:** ${discovery.category}\n\n`;
      
      if (discovery.description) {
        markdown += `#### Description\n\n${discovery.description}\n\n`;
      }
      
      if (discovery.details) {
        markdown += `#### Details\n\n${discovery.details}\n\n`;
      }
      
      if (discovery.evidence && discovery.evidence.length > 0) {
        markdown += `#### Evidence\n\n`;
        discovery.evidence.forEach(evidence => {
          markdown += `**${evidence.title}**\n\n`;
          if (evidence.type === 'image') {
            markdown += `![${evidence.caption || evidence.title}](${evidence.content})\n\n`;
          } else {
            markdown += `\`\`\`${evidence.language || ''}\n${evidence.content}\n\`\`\`\n\n`;
          }
          if (evidence.caption) {
            markdown += `*${evidence.caption}*\n\n`;
          }
        });
      }
    });
  }

  // Conclusion
  if (reportData.conclusion) {
    markdown += `## Conclusion\n\n${reportData.conclusion}\n\n`;
  }

  return markdown;
};

export const saveMarkdownFile = async (reportData: ReportData, t: TFunction): Promise<void> => {
  try {
    const markdown = await exportToMarkdown(reportData, t);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.clientName}_${reportData.projectName}_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error saving markdown:', error);
    throw new Error('Failed to save markdown file.');
  }
}; 