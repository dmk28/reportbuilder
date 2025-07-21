import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  Packer
} from 'docx';
import { saveAs } from 'file-saver';
import { ReportData, Finding, Discovery, Evidence } from '../types/reportTypes';
import { TFunction } from 'i18next';

// Main export function with simplified approach to avoid TypeScript errors
export const exportToDocx = async (reportData: ReportData, t: TFunction): Promise<void> => {
  try {
    // Create new document with simplified structure
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title page
            new Paragraph({
              text: reportData.clientName,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: t('report.title'),
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: reportData.projectName,
              heading: HeadingLevel.HEADING_2,
              alignment: AlignmentType.CENTER,
            }),
            
            // Testing period if available
            ...(reportData.testingPeriod.startDate && reportData.testingPeriod.endDate ? [
              new Paragraph({
                text: `${t('report.testingPeriod')}: ${reportData.testingPeriod.startDate} - ${reportData.testingPeriod.endDate}`,
                alignment: AlignmentType.CENTER,
              })
            ] : []),
            
            // Page break before table of contents
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            
            // Table of contents
            new Paragraph({
              text: t('report.tableOfContents'),
              heading: HeadingLevel.HEADING_1,
            }),
            
            // Executive Summary
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.executiveSummary'),
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: reportData.executiveSummary || t('empty.executiveSummary'),
            }),
            
            // Recommendations
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.recommendations'),
              heading: HeadingLevel.HEADING_1,
            }),
            ...(reportData.recommendations && reportData.recommendations.length > 0 
              ? reportData.recommendations.map(rec => (
                new Paragraph({
                  text: `• ${rec}`,
                })
              ))
              : [
                new Paragraph({
                  text: t('empty.recommendations'),
                })
              ]
            ),
            
            // Scope
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.scope'),
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: reportData.scope || t('empty.scope'),
            }),
            
            // Methodology
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.methodology'),
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: reportData.methodology || t('empty.methodology'),
            }),
            
            // Findings
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.findings'),
              heading: HeadingLevel.HEADING_1,
            }),
            ...(reportData.findings.length === 0 
              ? [new Paragraph({ text: t('empty.findings') })]
              : [
                // Findings summary table
                new Table({
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ text: t('form.title') })],
                        }),
                        new TableCell({
                          children: [new Paragraph({ text: t('form.severity') })],
                        }),
                      ],
                    }),
                    ...reportData.findings.map((finding, index) => (
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ text: `${index + 1}. ${finding.title}` })],
                          }),
                          new TableCell({
                            children: [new Paragraph({ text: t(`severity.${finding.severity.toLowerCase()}`) })],
                          }),
                        ],
                      })
                    )),
                  ],
                }),
                
                // Detailed findings
                ...reportData.findings.flatMap((finding, index) => ([
                  new Paragraph({
                    text: "",
                    pageBreakBefore: true,
                  }),
                  new Paragraph({
                    text: `${index + 1}. ${finding.title}`,
                    heading: HeadingLevel.HEADING_2,
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${t('form.severity')}: `,
                        bold: true,
                      }),
                      new TextRun({
                        text: t(`severity.${finding.severity.toLowerCase()}`),
                        bold: true,
                      }),
                    ],
                  }),
                  
                  // CVSS if available
                  ...(finding.cvss ? [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `CVSS: `,
                          bold: true,
                        }),
                        new TextRun({
                          text: `${finding.cvss.score.toFixed(1)} (${finding.cvss.vector})`,
                        }),
                      ],
                    })
                  ] : []),
                  
                  // Description
                  new Paragraph({
                    text: t('report.description'),
                    heading: HeadingLevel.HEADING_3,
                  }),
                  new Paragraph({
                    text: finding.description,
                  }),
                  
                  // Impact
                  new Paragraph({
                    text: t('report.impact'),
                    heading: HeadingLevel.HEADING_3,
                  }),
                  new Paragraph({
                    text: finding.impact,
                  }),
                  
                  // Remediation
                  new Paragraph({
                    text: t('report.remediation'),
                    heading: HeadingLevel.HEADING_3,
                  }),
                  new Paragraph({
                    text: finding.remediation,
                  }),
                  
                  // Evidence (simplified - only mentioning that evidence exists)
                  ...(finding.evidence && finding.evidence.length > 0 ? [
                    new Paragraph({
                      text: t('report.evidence'),
                      heading: HeadingLevel.HEADING_3,
                    }),
                    new Paragraph({
                      text: `${finding.evidence.length} evidence items available in the web application`,
                    })
                  ] : []),
                ])),
              ]
            ),
            
            // Discoveries
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.discoveries'),
              heading: HeadingLevel.HEADING_1,
            }),
            ...(reportData.discoveries.length === 0 
              ? [new Paragraph({ text: t('empty.discoveries') })]
              : reportData.discoveries.flatMap((discovery, index) => ([
                ...(index > 0 ? [
                  new Paragraph({
                    text: "",
                    pageBreakBefore: true,
                  })
                ] : []),
                new Paragraph({
                  text: discovery.title,
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${t('discovery.category')}: `,
                      bold: true,
                    }),
                    new TextRun({
                      text: discovery.category,
                    }),
                  ],
                }),
                
                // Description
                new Paragraph({
                  text: t('report.description'),
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({
                  text: discovery.description,
                }),
                
                // Details
                new Paragraph({
                  text: t('discovery.details'),
                  heading: HeadingLevel.HEADING_3,
                }),
                new Paragraph({
                  text: discovery.details,
                }),
                
                // Evidence (simplified - only mentioning that evidence exists)
                ...(discovery.evidence && discovery.evidence.length > 0 ? [
                  new Paragraph({
                    text: t('report.evidence'),
                    heading: HeadingLevel.HEADING_3,
                  }),
                  new Paragraph({
                    text: `${discovery.evidence.length} evidence items available in the web application`,
                  })
                ] : []),
              ]))
            ),
            
            // Conclusion
            new Paragraph({
              text: "",
              pageBreakBefore: true,
            }),
            new Paragraph({
              text: t('report.conclusion'),
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: reportData.conclusion || t('empty.conclusion'),
            }),
          ],
        },
      ],
    });
    
    // Save document
    Packer.toBlob(doc).then(blob => {
      const sanitizedClientName = reportData.clientName.replace(/[^a-z0-9]/gi, '_');
      const sanitizedProjectName = reportData.projectName.replace(/[^a-z0-9]/gi, '_');
      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `${sanitizedClientName}_${sanitizedProjectName}_${timestamp}.docx`);
    });
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw error;
  }
}; 