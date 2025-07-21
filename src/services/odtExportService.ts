import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ReportData } from '../types/reportTypes';
import { TFunction } from 'i18next';

// Export to ODT (OpenDocument Text) format
export const exportToOdt = async (reportData: ReportData, t: TFunction): Promise<void> => {
  try {
    // Create a new ZIP file (ODT is a ZIP file with XML content)
    const zip = new JSZip();
    
    // Add the mimetype file (required for ODT)
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text');
    
    // Create the META-INF directory with manifest
    const metaInf = zip.folder('META-INF');
    metaInf.file('manifest.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
        <manifest:file-entry manifest:media-type="application/vnd.oasis.opendocument.text" manifest:full-path="/"/>
        <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="content.xml"/>
        <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="meta.xml"/>
        <manifest:file-entry manifest:media-type="text/xml" manifest:full-path="styles.xml"/>
      </manifest:manifest>`);
    
    // Add basic meta information
    zip.file('meta.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <office:document-meta 
        xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" 
        xmlns:dc="http://purl.org/dc/elements/1.1/">
        <office:meta>
          <dc:title>${escapeXml(reportData.clientName)} - ${escapeXml(reportData.projectName)}</dc:title>
          <dc:subject>Penetration Test Report</dc:subject>
          <dc:creator>Sunset Security</dc:creator>
          <dc:date>${new Date().toISOString()}</dc:date>
        </office:meta>
      </office:document-meta>`);
    
    // Add styles information
    zip.file('styles.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <office:document-styles 
        xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0">
        <office:styles>
          <style:style style:name="Standard" style:family="paragraph" style:class="text">
            <style:text-properties fo:font-size="12pt" style:font-name="Liberation Sans"/>
          </style:style>
          <style:style style:name="Heading" style:family="paragraph" style:parent-style-name="Standard" style:next-style-name="Text_20_body" style:class="text">
            <style:text-properties fo:font-size="14pt" style:font-name="Liberation Sans" fo:font-weight="bold"/>
          </style:style>
          <style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Heading" style:next-style-name="Text_20_body" style:class="text">
            <style:text-properties fo:font-size="18pt" fo:font-weight="bold"/>
          </style:style>
          <style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Heading" style:next-style-name="Text_20_body" style:class="text">
            <style:text-properties fo:font-size="16pt" fo:font-weight="bold"/>
          </style:style>
          <style:style style:name="Heading_20_3" style:display-name="Heading 3" style:family="paragraph" style:parent-style-name="Heading" style:next-style-name="Text_20_body" style:class="text">
            <style:text-properties fo:font-size="14pt" fo:font-weight="bold"/>
          </style:style>
          <style:style style:name="Text_20_body" style:display-name="Text body" style:family="paragraph" style:parent-style-name="Standard" style:class="text">
            <style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.212cm"/>
          </style:style>
          <style:style style:name="List" style:family="paragraph" style:parent-style-name="Text_20_body" style:class="list">
            <style:text-properties fo:font-size="12pt"/>
          </style:style>
          <style:style style:name="Bold" style:family="text">
            <style:text-properties fo:font-weight="bold"/>
          </style:style>
          <style:style style:name="Italic" style:family="text">
            <style:text-properties fo:font-style="italic"/>
          </style:style>
        </office:styles>
      </office:document-styles>`);
    
    // Generate the document content
    let content = `<?xml version="1.0" encoding="UTF-8"?>
      <office:document-content 
        xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
        xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
        xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
        xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
        xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
        xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
        xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
        xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
        xmlns:chart="urn:oasis:names:tc:opendocument:xmlns:chart:1.0"
        xmlns:dr3d="urn:oasis:names:tc:opendocument:xmlns:dr3d:1.0"
        xmlns:math="http://www.w3.org/1998/Math/MathML"
        xmlns:form="urn:oasis:names:tc:opendocument:xmlns:form:1.0"
        xmlns:script="urn:oasis:names:tc:opendocument:xmlns:script:1.0"
        xmlns:ooo="http://openoffice.org/2004/office"
        xmlns:ooow="http://openoffice.org/2004/writer"
        xmlns:oooc="http://openoffice.org/2004/calc"
        xmlns:dom="http://www.w3.org/2001/xml-events"
        xmlns:xforms="http://www.w3.org/2002/xforms"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <office:body>
          <office:text>
            <!-- Title Page -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(reportData.clientName)}</text:h>
            <text:p text:style-name="Text_20_body">${escapeXml(reportData.projectName)}</text:p>
            
            ${reportData.testingPeriod.startDate && reportData.testingPeriod.endDate ? 
              `<text:p text:style-name="Text_20_body">
                <text:span text:style-name="Bold">${escapeXml(t('report.testingPeriod'))}:</text:span> 
                ${escapeXml(reportData.testingPeriod.startDate)} - ${escapeXml(reportData.testingPeriod.endDate)}
              </text:p>` : ''}
            
            <text:p text:style-name="Text_20_body" />
            
            <!-- Executive Summary -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.executiveSummary'))}</text:h>
            <text:p text:style-name="Text_20_body">${escapeXml(reportData.executiveSummary || t('empty.executiveSummary'))}</text:p>
            
            <!-- Recommendations (if available) -->
            ${reportData.recommendations && reportData.recommendations.length > 0 ? `
              <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.recommendations'))}</text:h>
              <text:list text:style-name="List">
                ${reportData.recommendations.map(rec => `
                  <text:list-item>
                    <text:p text:style-name="List">${escapeXml(rec)}</text:p>
                  </text:list-item>
                `).join('')}
              </text:list>
            ` : ''}
            
            <!-- Scope -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.scope'))}</text:h>
            <text:p text:style-name="Text_20_body">${escapeXml(reportData.scope || t('empty.scope'))}</text:p>
            
            <!-- Methodology -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.methodology'))}</text:h>
            <text:p text:style-name="Text_20_body">${escapeXml(reportData.methodology || t('empty.methodology'))}</text:p>
            
            <!-- Findings -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.findings'))}</text:h>
            ${reportData.findings.length === 0 ? 
              `<text:p text:style-name="Text_20_body">${escapeXml(t('empty.findings'))}</text:p>` :
              
              `<!-- Findings Summary Table -->
              <table:table table:name="FindingsSummary">
                <table:table-column table:number-columns-repeated="2"/>
                <table:table-header-rows>
                  <table:table-row>
                    <table:table-cell office:value-type="string">
                      <text:p text:style-name="Bold">${escapeXml(t('form.title'))}</text:p>
                    </table:table-cell>
                    <table:table-cell office:value-type="string">
                      <text:p text:style-name="Bold">${escapeXml(t('form.severity'))}</text:p>
                    </table:table-cell>
                  </table:table-row>
                </table:table-header-rows>
                ${reportData.findings.map((finding, index) => `
                  <table:table-row>
                    <table:table-cell office:value-type="string">
                      <text:p text:style-name="Text_20_body">${index + 1}. ${escapeXml(finding.title)}</text:p>
                    </table:table-cell>
                    <table:table-cell office:value-type="string">
                      <text:p text:style-name="Text_20_body">${escapeXml(t(`severity.${finding.severity.toLowerCase()}`))}</text:p>
                    </table:table-cell>
                  </table:table-row>
                `).join('')}
              </table:table>
              
              <!-- Detailed Findings -->
              ${reportData.findings.map((finding, index) => `
                <text:h text:style-name="Heading_20_2" text:outline-level="2">${index + 1}. ${escapeXml(finding.title)}</text:h>
                
                <text:p text:style-name="Text_20_body">
                  <text:span text:style-name="Bold">${escapeXml(t('form.severity'))}:</text:span> 
                  ${escapeXml(t(`severity.${finding.severity.toLowerCase()}`))}
                </text:p>
                
                ${finding.cvss ? `
                  <text:p text:style-name="Text_20_body">
                    <text:span text:style-name="Bold">CVSS:</text:span> 
                    ${finding.cvss.score.toFixed(1)} (${escapeXml(finding.cvss.vector)})
                  </text:p>
                ` : ''}
                
                <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('report.description'))}</text:h>
                <text:p text:style-name="Text_20_body">${escapeXml(finding.description)}</text:p>
                
                <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('report.impact'))}</text:h>
                <text:p text:style-name="Text_20_body">${escapeXml(finding.impact)}</text:p>
                
                <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('report.remediation'))}</text:h>
                <text:p text:style-name="Text_20_body">${escapeXml(finding.remediation)}</text:p>
                
                ${finding.evidence && finding.evidence.length > 0 ? `
                  <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('report.evidence'))}</text:h>
                  ${finding.evidence.map(item => `
                    <text:p text:style-name="Bold">${escapeXml(item.title)}</text:p>
                    <text:p text:style-name="Text_20_body">${
                      item.type === 'image' 
                        ? `[${escapeXml(t('evidence.imageReference'))}: ${escapeXml(item.title)}]` 
                        : escapeXml(item.content)
                    }</text:p>
                    ${item.caption ? `<text:p text:style-name="Italic">${escapeXml(item.caption)}</text:p>` : ''}
                  `).join('')}
                ` : ''}
              `).join('')}`
            }
            
            <!-- Discoveries -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.discoveries'))}</text:h>
            ${reportData.discoveries.length === 0 ? 
              `<text:p text:style-name="Text_20_body">${escapeXml(t('empty.discoveries'))}</text:p>` :
              
              `<!-- Detailed Discoveries -->
              ${reportData.discoveries.map(discovery => `
                <text:h text:style-name="Heading_20_2" text:outline-level="2">${escapeXml(discovery.title)}</text:h>
                
                <text:p text:style-name="Text_20_body">
                  <text:span text:style-name="Bold">${escapeXml(t('discovery.category'))}:</text:span> 
                  ${escapeXml(discovery.category)}
                </text:p>
                
                <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('report.description'))}</text:h>
                <text:p text:style-name="Text_20_body">${escapeXml(discovery.description)}</text:p>
                
                <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('discovery.details'))}</text:h>
                <text:p text:style-name="Text_20_body">${escapeXml(discovery.details)}</text:p>
                
                ${discovery.evidence && discovery.evidence.length > 0 ? `
                  <text:h text:style-name="Heading_20_3" text:outline-level="3">${escapeXml(t('report.evidence'))}</text:h>
                  ${discovery.evidence.map(item => `
                    <text:p text:style-name="Bold">${escapeXml(item.title)}</text:p>
                    <text:p text:style-name="Text_20_body">${
                      item.type === 'image' 
                        ? `[${escapeXml(t('evidence.imageReference'))}: ${escapeXml(item.title)}]` 
                        : escapeXml(item.content)
                    }</text:p>
                    ${item.caption ? `<text:p text:style-name="Italic">${escapeXml(item.caption)}</text:p>` : ''}
                  `).join('')}
                ` : ''}
              `).join('')}`
            }
            
            <!-- Conclusion -->
            <text:h text:style-name="Heading_20_1" text:outline-level="1">${escapeXml(t('report.conclusion'))}</text:h>
            <text:p text:style-name="Text_20_body">${escapeXml(reportData.conclusion || t('empty.conclusion'))}</text:p>
          </office:text>
        </office:body>
      </office:document-content>`;
    
    // Clean up the XML by removing indentation and excess whitespace
    content = content.replace(/>\s+</g, '><').trim();
    
    // Add content to the zip file
    zip.file('content.xml', content);
    
    // Generate the final ODT file
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.text' });
    
    // Create sanitized filename
    const sanitizedClientName = reportData.clientName.replace(/[^a-z0-9]/gi, '_');
    const sanitizedProjectName = reportData.projectName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Save the file
    saveAs(blob, `${sanitizedClientName}_${sanitizedProjectName}_${timestamp}.odt`);
  } catch (error) {
    console.error('Error generating ODT:', error);
    throw error;
  }
};

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
} 