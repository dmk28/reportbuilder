export interface ReportData {
  clientName: string;
  projectName: string;
  executiveSummary: string;
  findings: Array<Finding>;
  discoveries: Array<Discovery>;
  recommendations: string[];
  methodology: string;
  scope: string;
  conclusion: string;
  testingPeriod: {
    startDate: string;
    endDate: string;
  };
  logo?: string; // base64 or URL
  coverPage?: {
    subtitle?: string;
    tagline?: string;
    date?: string;
    // Add more fields as needed
  };
}

export interface Finding {
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  description: string;
  impact: string;
  remediation: string;
  evidence: Evidence[];
  cvss: {
    score: number;
    vector: string;
    metrics: {
      attackVector: 'N' | 'A' | 'L' | 'P';
      attackComplexity: 'L' | 'H';
      privilegesRequired: 'N' | 'L' | 'H';
      userInteraction: 'N' | 'R';
      scope: 'U' | 'C';
      confidentiality: 'N' | 'L' | 'H';
      integrity: 'N' | 'L' | 'H';
      availability: 'N' | 'L' | 'H';
    };
  };
}

export interface Discovery {
  id: string;
  title: string;
  category: string;
  description: string;
  details: string;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  type: 'image' | 'code';
  title: string;
  content: string; // Base64 for images, code string for code snippets
  caption: string;
  language?: string; // For code snippets
}

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface CVSSMetrics {
  attackVector: 'N' | 'A' | 'L' | 'P';
  attackComplexity: 'L' | 'H';
  privilegesRequired: 'N' | 'L' | 'H';
  userInteraction: 'N' | 'R';
  scope: 'U' | 'C';
  confidentiality: 'N' | 'L' | 'H';
  integrity: 'N' | 'L' | 'H';
  availability: 'N' | 'L' | 'H';
} 