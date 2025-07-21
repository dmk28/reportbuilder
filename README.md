# Pentest Report Generator

A modern web application for generating professional penetration testing reports. Built with React, TypeScript, and Tailwind CSS.

## Features

- Clean, modern UI for inputting report details
- Support for multiple findings with severity levels
- Real-time preview of the report
- Structured sections for methodology, scope, and executive summary
- Responsive design that works on all devices

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm 7.x or later

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pentest-report-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Fill in the client information and project details
2. Add your findings using the "Add Finding" button
3. For each finding, specify:
   - Title
   - Severity level
   - Description
   - Impact
   - Remediation steps
4. Preview your report in real-time on the right side
5. Use the generated report for your pentest documentation

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## License

MIT
