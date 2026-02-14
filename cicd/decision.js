const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'report', 'compiler-report.json');
if (!fs.existsSync(reportPath)) {
  console.error('Report not found:', reportPath);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

if (report.semanticErrors) {
  // Print message before exiting to ensure PowerShell displays it reliably
  console.log('❌ Deployment Blocked');
  process.exitCode = 1;
} else {
  console.log('✅ Deployment Allowed');
  process.exitCode = 0;
}
