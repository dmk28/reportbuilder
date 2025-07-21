import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { InitOptions } from 'i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // App
      'app.title': 'Pentest Report Generator',
      'app.builder': 'Report Builder',
      'app.description': 'Fill in the details below to generate your penetration testing report.',
      
      // Buttons
      'button.exportReport': 'Export Report',
      'button.downloadPdf': 'Download PDF',
      'button.addFinding': 'Add Finding',
      'button.addDiscovery': 'Add Discovery',
      'button.exportPdf': 'Export PDF',
      'button.removeFinding': 'Remove Finding',
      'button.removeDiscovery': 'Remove Discovery',
      'button.addEvidence': 'Add Evidence',
      'button.uploadImage': 'Upload Image',
      'button.addCodeSnippet': 'Add Code Snippet',
      'button.newReport': 'New Report',
      'button.myReports': 'My Reports',
      'button.createFirst': 'Create Your First Report',
      'button.duplicate': 'Duplicate',
      'button.delete': 'Delete',
      'button.exportMarkdown': 'Export Markdown',
      'button.exportDocx': 'Export Word Document',
      'button.exportOdt': 'Export LibreOffice Document',
      'button.edit': 'Edit',
      'button.preview': 'Preview',
      'button.exporting': 'Exporting...',
      
      // Form Sections
      'form.section.basicInfo': 'Basic Information',
      'form.section.reportContent': 'Report Content',
      'form.section.findings': 'Vulnerabilities',
      'form.section.discoveries': 'Reconnaissance & Discovery',
      
      // Form Fields
      'form.clientName': 'Client Name',
      'form.projectName': 'Project Name',
      'form.testingPeriod': 'Testing Period',
      'form.startDate': 'Start Date',
      'form.endDate': 'End Date',
      'form.executiveSummary': 'Executive Summary',
      'form.scope': 'Scope',
      'form.methodology': 'Methodology',
      'form.conclusion': 'Final Conclusion',
      'form.findings': 'Findings',
      'form.discoveries': 'Discoveries',
      'form.finding': 'Finding',
      'form.discovery': 'Discovery',
      'form.title': 'Title',
      'form.severity': 'Severity',
      'form.description': 'Description',
      'form.impact': 'Impact',
      'form.remediation': 'Remediation',
      'form.evidence': 'Evidence',
      'form.category': 'Category',
      'form.details': 'Details',
      'form.cvss': 'CVSS Score',
      'form.cvssVector': 'CVSS Vector',
      'form.cvssMetrics': 'CVSS Metrics',
      'form.attackVector': 'Attack Vector',
      'form.attackComplexity': 'Attack Complexity',
      'form.privilegesRequired': 'Privileges Required',
      'form.userInteraction': 'User Interaction',
      'form.confidentiality': 'Confidentiality',
      'form.integrity': 'Integrity',
      'form.availability': 'Availability',
      'form.codeSnippet': 'Code Snippet',
      'form.language': 'Language',
      'form.caption': 'Caption',
      'form.recommendations': 'Recommendations',
      
      // Finding Fields
      'finding.title': 'Title',
      'finding.severity': 'Severity',
      'finding.description': 'Description',
      'finding.impact': 'Impact',
      'finding.remediation': 'Remediation',
      'finding.evidence': 'Evidence',
      
      // Discovery Fields
      'discovery.title': 'Title',
      'discovery.category': 'Category',
      'discovery.description': 'Description',
      'discovery.details': 'Details',
      'discovery.evidence': 'Evidence',
      
      // Discovery Categories
      'discovery.category.network': 'Network',
      'discovery.category.host': 'Host',
      'discovery.category.web': 'Web',
      'discovery.category.database': 'Database',
      'discovery.category.cloud': 'Cloud',
      'discovery.category.mobile': 'Mobile',
      'discovery.category.api': 'API',
      'discovery.category.other': 'Other',
      
      // Evidence
      'evidence.uploadImage': 'Upload Image',
      'evidence.addCode': 'Add Code Snippet',
      'evidence.current': 'Current Evidence',
      'evidence.dragOrClick': 'Drag and drop or click to upload',
      'evidence.imageTypes': 'PNG, JPG, GIF up to 2MB',
      'evidence.codeTitle': 'Title',
      'evidence.codeTitlePlaceholder': 'Enter a title for this code snippet',
      'evidence.code': 'Code',
      'evidence.codePlaceholder': 'Paste your code here or write markdown',
      'evidence.language': 'Language',
      'evidence.caption': 'Caption',
      'evidence.captionPlaceholder': 'Enter a caption (optional)',
      'evidence.defaultCodeTitle': 'Code Snippet',
      'evidence.imageReference': 'Image reference',
      
      // Errors
      'error.fileTooLarge': 'File is too large. Maximum size is {{size}}',
      'error.invalidFileType': 'Invalid file type. Please upload an image.',
      'error.emptyCode': 'Code snippet cannot be empty',
      'error.exportMarkdown': 'Error exporting markdown',
      'error.exportDocx': 'Error exporting Word document',
      
      // Placeholders
      'placeholder.clientName': 'Enter client name',
      'placeholder.projectName': 'Enter project name',
      'placeholder.executiveSummary': 'Provide an executive summary of the penetration test',
      'placeholder.scope': 'Define the scope of the penetration test',
      'placeholder.methodology': 'Describe the methodology used during testing',
      'placeholder.findingTitle': 'Finding Title',
      'placeholder.description': 'Detailed description of the finding',
      'placeholder.impact': 'Impact of this finding',
      'placeholder.remediation': 'Steps to remediate this finding',
      'placeholder.discoveryTitle': 'Discovery Title',
      'placeholder.discoveryDescription': 'Brief description of what was discovered',
      'placeholder.discoveryDetails': 'Detailed information about the discovery',
      'placeholder.conclusion': 'Provide a final conclusion about the security assessment',
      
      // Preview
      'preview.title': 'Report Preview',
      'preview.clientInfo': 'Client Information',
      'preview.client': 'Client',
      'preview.project': 'Project',
      'preview.testingPeriod': 'Testing Period',
      'preview.to': 'to',
      'preview.evidence': 'Evidence',
      
      // Empty States
      'empty.executiveSummary': 'No executive summary provided.',
      'empty.scope': 'No scope defined.',
      'empty.methodology': 'No methodology described.',
      'empty.findings': 'No vulnerabilities added yet.',
      'empty.description': 'No description provided.',
      'empty.impact': 'No impact described.',
      'empty.remediation': 'No remediation steps provided.',
      'empty.evidence': 'No evidence provided.',
      'empty.title': 'Untitled',
      'empty.discoveries': 'No discoveries added yet.',
      'empty.details': 'No details provided.',
      'empty.conclusion': 'No conclusion provided.',
      'empty.recommendations': 'No recommendations provided.',
      'empty.content': 'No content provided.',
      
      // Severity Levels
      'severity.critical': 'Critical',
      'severity.high': 'High',
      'severity.medium': 'Medium',
      'severity.low': 'Low',
      'severity.info': 'Info',
      
      // CVSS
      'cvss.score': 'CVSS Score',
      'cvss.vector': 'Vector String',
      'cvss.metrics.attackVector': 'Attack Vector',
      'cvss.metrics.attackComplexity': 'Attack Complexity',
      'cvss.metrics.privilegesRequired': 'Privileges Required',
      'cvss.metrics.userInteraction': 'User Interaction',
      'cvss.metrics.scope': 'Scope',
      'cvss.metrics.confidentiality': 'Confidentiality',
      'cvss.metrics.integrity': 'Integrity',
      'cvss.metrics.availability': 'Availability',
      
      // CVSS Values
      'cvss.values.network': 'Network',
      'cvss.values.adjacent': 'Adjacent',
      'cvss.values.local': 'Local',
      'cvss.values.physical': 'Physical',
      'cvss.values.low': 'Low',
      'cvss.values.high': 'High',
      'cvss.values.none': 'None',
      'cvss.values.required': 'Required',
      'cvss.values.unchanged': 'Unchanged',
      'cvss.values.changed': 'Changed',
      
      // Findings Distribution
      'findings.distribution': 'Severity Distribution',
      'findings.total': 'Total Findings',
      
      // Report Sections
      'report.clientInfo': 'Client Information',
      'report.executiveSummary': 'Executive Summary',
      'report.scope': 'Scope',
      'report.methodology': 'Methodology',
      'report.findingsSummary': 'Findings Summary',
      'report.discoveriesSummary': 'Discoveries Summary',
      'report.conclusion': 'FINAL CONCLUSION',
      'report.title': 'Penetration Test Report',
      'report.tableOfContents': 'Table of Contents',
      'report.findings': 'Findings',
      'report.discoveries': 'Discoveries',
      'report.severity': 'Severity',
      'report.impact': 'Impact',
      'report.remediation': 'Remediation',
      'report.evidence': 'Evidence',
      'report.category': 'Category',
      'report.details': 'Details',
      'report.recommendations': 'Recommendations',
      'report.testingPeriod': 'Testing Period',
      'report.findingDetails': 'Finding Details',
      'report.discoveryDetails': 'Discovery Details',
      'report.severityDistribution': 'Severity Distribution',
      
      // Button Labels
      'button.collapseFinding': 'Collapse',
      'button.expandFinding': 'Expand',
      'button.collapseDiscovery': 'Collapse',
      'button.expandDiscovery': 'Expand',
      
      // Reports
      'reports.savedReports': 'Saved Reports',
      'reports.loading': 'Loading reports...',
      'reports.noReports': 'No reports found. Create your first report!',
      'reports.untitledClient': 'Untitled Client',
      'reports.untitledProject': 'Untitled Project',
      'reports.lastModified': 'Last modified',
      'reports.saving': 'Saving...',
      'reports.lastSaved': 'Last saved',
      'reports.copy': 'Copy',
      'confirm.deleteReport': 'Are you sure you want to delete this report? This action cannot be undone.',
      'success.exportMarkdown': 'Report exported to markdown successfully',
      'success.markdownExport': 'Report exported successfully. Extract the ZIP file to view the report.',
      'error.markdownExport': 'Error exporting report to markdown.',
      'toast.extractZip': 'Please extract the ZIP file to view the report with images.',
      'success.exportDocx': 'Report exported to Word document successfully',
    }
  },
  pt: {
    translation: {
      // App
      'app.title': 'Gerador de Relatórios de Pentest',
      'app.builder': 'Construtor de Relatórios',
      'app.description': 'Preencha os detalhes abaixo para gerar seu relatório de teste de penetração.',
      
      // Buttons
      'button.exportReport': 'Exportar Relatório',
      'button.downloadPdf': 'Baixar PDF',
      'button.addFinding': 'Adicionar Vulnerabilidade',
      'button.addDiscovery': 'Adicionar Descoberta',
      'button.exportPdf': 'Exportar PDF',
      'button.removeFinding': 'Remover Vulnerabilidade',
      'button.removeDiscovery': 'Remover Descoberta',
      'button.addEvidence': 'Adicionar Evidência',
      'button.uploadImage': 'Enviar Imagem',
      'button.addCodeSnippet': 'Adicionar Trecho de Código',
      'button.newReport': 'Novo Relatório',
      'button.myReports': 'Meus Relatórios',
      'button.createFirst': 'Criar Seu Primeiro Relatório',
      'button.duplicate': 'Duplicar',
      'button.delete': 'Excluir',
      'button.exportMarkdown': 'Exportar Markdown',
      'button.exportDocx': 'Exportar Documento Word',
      'button.exportOdt': 'Exportar Documento LibreOffice',
      'button.edit': 'Editar',
      'button.preview': 'Visualizar',
      'button.exporting': 'Exportando...',
      
      // Form Sections
      'form.section.basicInfo': 'Informações Básicas',
      'form.section.reportContent': 'Conteúdo do Relatório',
      'form.section.findings': 'Vulnerabilidades',
      'form.section.discoveries': 'Reconhecimento e Descobertas',
      
      // Form Fields
      'form.clientName': 'Nome do Cliente',
      'form.projectName': 'Nome do Projeto',
      'form.testingPeriod': 'Período de Teste',
      'form.startDate': 'Data de Início',
      'form.endDate': 'Data de Fim',
      'form.executiveSummary': 'Resumo Executivo',
      'form.scope': 'Escopo',
      'form.methodology': 'Metodologia',
      'form.conclusion': 'Conclusão Final',
      'form.findings': 'Vulnerabilidades',
      'form.discoveries': 'Descobertas',
      'form.finding': 'Vulnerabilidade',
      'form.discovery': 'Descoberta',
      'form.title': 'Título',
      'form.severity': 'Severidade',
      'form.description': 'Descrição',
      'form.impact': 'Impacto',
      'form.remediation': 'Remediação',
      'form.evidence': 'Evidência',
      'form.category': 'Categoria',
      'form.details': 'Detalhes',
      'form.cvss': 'Pontuação CVSS',
      'form.cvssVector': 'Vetor CVSS',
      'form.cvssMetrics': 'Métricas CVSS',
      'form.attackVector': 'Vetor de Ataque',
      'form.attackComplexity': 'Complexidade do Ataque',
      'form.privilegesRequired': 'Privilégios Necessários',
      'form.userInteraction': 'Interação do Usuário',
      'form.confidentiality': 'Confidencialidade',
      'form.integrity': 'Integridade',
      'form.availability': 'Disponibilidade',
      'form.codeSnippet': 'Trecho de Código',
      'form.language': 'Linguagem',
      'form.caption': 'Legenda',
      'form.recommendations': 'Recomendações',
      
      // Finding Fields
      'finding.title': 'Título',
      'finding.severity': 'Severidade',
      'finding.description': 'Descrição',
      'finding.impact': 'Impacto',
      'finding.remediation': 'Remediação',
      'finding.evidence': 'Evidência',
      
      // Discovery Fields
      'discovery.title': 'Título',
      'discovery.category': 'Categoria',
      'discovery.description': 'Descrição',
      'discovery.details': 'Detalhes',
      'discovery.evidence': 'Evidência',
      
      // Discovery Categories
      'discovery.category.network': 'Rede',
      'discovery.category.host': 'Host',
      'discovery.category.web': 'Web',
      'discovery.category.database': 'Banco de Dados',
      'discovery.category.cloud': 'Nuvem',
      'discovery.category.mobile': 'Mobile',
      'discovery.category.api': 'API',
      'discovery.category.other': 'Outro',
      
      // Evidence
      'evidence.uploadImage': 'Enviar Imagem',
      'evidence.addCode': 'Adicionar Trecho de Código',
      'evidence.current': 'Evidência Atual',
      'evidence.dragOrClick': 'Arraste e solte ou clique para enviar',
      'evidence.imageTypes': 'PNG, JPG, GIF até 2MB',
      'evidence.codeTitle': 'Título',
      'evidence.codeTitlePlaceholder': 'Digite um título para este trecho de código',
      'evidence.code': 'Código',
      'evidence.codePlaceholder': 'Cole seu código aqui ou escreva markdown',
      'evidence.language': 'Linguagem',
      'evidence.caption': 'Legenda',
      'evidence.captionPlaceholder': 'Digite uma legenda (opcional)',
      'evidence.defaultCodeTitle': 'Trecho de Código',
      'evidence.imageReference': 'Referência da imagem',
      
      // Errors
      'error.fileTooLarge': 'Arquivo muito grande. Tamanho máximo é {{size}}',
      'error.invalidFileType': 'Tipo de arquivo inválido. Por favor, envie uma imagem.',
      'error.emptyCode': 'Trecho de código não pode estar vazio',
      'error.exportMarkdown': 'Erro ao exportar markdown',
      'error.exportDocx': 'Erro ao exportar documento Word',
      
      // Placeholders
      'placeholder.clientName': 'Digite o nome do cliente',
      'placeholder.projectName': 'Digite o nome do projeto',
      'placeholder.executiveSummary': 'Forneça um resumo executivo do teste de penetração',
      'placeholder.scope': 'Defina o escopo do teste de penetração',
      'placeholder.methodology': 'Descreva a metodologia usada durante o teste',
      'placeholder.findingTitle': 'Título da Vulnerabilidade',
      'placeholder.description': 'Descrição detalhada da vulnerabilidade',
      'placeholder.impact': 'Impacto desta vulnerabilidade',
      'placeholder.remediation': 'Passos para remediar esta vulnerabilidade',
      'placeholder.discoveryTitle': 'Título da Descoberta',
      'placeholder.discoveryDescription': 'Breve descrição do que foi descoberto',
      'placeholder.discoveryDetails': 'Informações detalhadas sobre a descoberta',
      'placeholder.conclusion': 'Forneça uma conclusão final sobre a avaliação de segurança',
      
      // Preview
      'preview.title': 'Visualização do Relatório',
      'preview.clientInfo': 'Informações do Cliente',
      'preview.client': 'Cliente',
      'preview.project': 'Projeto',
      'preview.testingPeriod': 'Período de Teste',
      'preview.to': 'até',
      'preview.evidence': 'Evidência',
      
      // Empty States
      'empty.executiveSummary': 'Nenhum resumo executivo fornecido.',
      'empty.scope': 'Nenhum escopo definido.',
      'empty.methodology': 'Nenhuma metodologia descrita.',
      'empty.findings': 'Nenhuma vulnerabilidade adicionada ainda.',
      'empty.description': 'Nenhuma descrição fornecida.',
      'empty.impact': 'Nenhum impacto descrito.',
      'empty.remediation': 'Nenhum passo de remediação fornecido.',
      'empty.evidence': 'Nenhuma evidência fornecida.',
      'empty.title': 'Sem título',
      'empty.discoveries': 'Nenhuma descoberta adicionada ainda.',
      'empty.details': 'Nenhum detalhe fornecido.',
      'empty.conclusion': 'Nenhuma conclusão fornecida.',
      'empty.recommendations': 'Nenhuma recomendação fornecida.',
      'empty.content': 'Nenhum conteúdo fornecido.',
      
      // Severity Levels
      'severity.critical': 'Crítico',
      'severity.high': 'Alto',
      'severity.medium': 'Médio',
      'severity.low': 'Baixo',
      'severity.info': 'Informação',
      
      // CVSS
      'cvss.score': 'Pontuação CVSS',
      'cvss.vector': 'String do Vetor',
      'cvss.metrics.attackVector': 'Vetor de Ataque',
      'cvss.metrics.attackComplexity': 'Complexidade do Ataque',
      'cvss.metrics.privilegesRequired': 'Privilégios Necessários',
      'cvss.metrics.userInteraction': 'Interação do Usuário',
      'cvss.metrics.scope': 'Escopo',
      'cvss.metrics.confidentiality': 'Confidencialidade',
      'cvss.metrics.integrity': 'Integridade',
      'cvss.metrics.availability': 'Disponibilidade',
      
      // CVSS Values
      'cvss.values.network': 'Rede',
      'cvss.values.adjacent': 'Adjacente',
      'cvss.values.local': 'Local',
      'cvss.values.physical': 'Físico',
      'cvss.values.low': 'Baixo',
      'cvss.values.high': 'Alto',
      'cvss.values.none': 'Nenhum',
      'cvss.values.required': 'Necessário',
      'cvss.values.unchanged': 'Inalterado',
      'cvss.values.changed': 'Alterado',
      
      // Findings Distribution
      'findings.distribution': 'Distribuição de Severidade',
      'findings.total': 'Total de Vulnerabilidades',
      
      // Report Sections
      'report.clientInfo': 'Informações do Cliente',
      'report.executiveSummary': 'Resumo Executivo',
      'report.scope': 'Escopo',
      'report.methodology': 'Metodologia',
      'report.findingsSummary': 'Resumo das Vulnerabilidades',
      'report.discoveriesSummary': 'Resumo das Descobertas',
      'report.conclusion': 'CONCLUSÃO FINAL',
      'report.title': 'Relatório de Teste de Penetração',
      'report.tableOfContents': 'Índice',
      'report.findings': 'Vulnerabilidades',
      'report.discoveries': 'Descobertas',
      'report.severity': 'Severidade',
      'report.impact': 'Impacto',
      'report.remediation': 'Remediação',
      'report.evidence': 'Evidência',
      'report.category': 'Categoria',
      'report.details': 'Detalhes',
      'report.recommendations': 'Recomendações',
      'report.testingPeriod': 'Período de Teste',
      'report.findingDetails': 'Detalhes da Vulnerabilidade',
      'report.discoveryDetails': 'Detalhes da Descoberta',
      'report.severityDistribution': 'Distribuição de Severidade',
      
      // Button Labels
      'button.collapseFinding': 'Recolher',
      'button.expandFinding': 'Expandir',
      'button.collapseDiscovery': 'Recolher',
      'button.expandDiscovery': 'Expandir',
      
      // Reports
      'reports.savedReports': 'Relatórios Salvos',
      'reports.loading': 'Carregando relatórios...',
      'reports.noReports': 'Nenhum relatório encontrado. Crie seu primeiro relatório!',
      'reports.untitledClient': 'Cliente Sem Título',
      'reports.untitledProject': 'Projeto Sem Título',
      'reports.lastModified': 'Última modificação',
      'reports.saving': 'Salvando...',
      'reports.lastSaved': 'Último salvamento',
      'reports.copy': 'Cópia',
      'confirm.deleteReport': 'Tem certeza de que deseja excluir este relatório? Esta ação não pode ser desfeita.',
      'success.exportMarkdown': 'Relatório exportado para markdown com sucesso',
      'success.markdownExport': 'Relatório exportado com sucesso. Extraia o arquivo ZIP para visualizar o relatório.',
      'error.markdownExport': 'Erro ao exportar relatório para markdown.',
      'toast.extractZip': 'Por favor, extraia o arquivo ZIP para visualizar o relatório com imagens.',
      'success.exportDocx': 'Relatório exportado para documento Word com sucesso',
    }
  }
};

// i18n configuration
const config: InitOptions = {
  resources,
  fallbackLng: 'en',
  debug: false,
  
  interpolation: {
    escapeValue: false,
  },
  
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
  
  react: {
    useSuspense: false,
  },
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(config);

export default i18n; 