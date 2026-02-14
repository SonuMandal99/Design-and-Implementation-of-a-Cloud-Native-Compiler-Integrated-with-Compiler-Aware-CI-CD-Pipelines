const fs = require('fs');
const path = require('path');
const analyze = require('./semanticAnalyzer');

const inputFile = process.env.INPUT_FILE || 'invalid_code.js';
const srcPath = path.join(__dirname, '..', 'input', inputFile);
const outDir = path.join(__dirname, '..', 'report');
const outPath = path.join(outDir, 'compiler-report.json');

if (!fs.existsSync(srcPath)) {
  console.error('Source file not found:', srcPath);
  process.exit(1);
}

const source = fs.readFileSync(srcPath, 'utf8');

// Minimal preprocessing: register function parameters as declared variables
// so that analyzers which do not track parameter scopes do not report false positives.
let preprocessed = source;
const paramNames = [];
const funcParamRegex = /function\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\(([^)]*)\)/g;
let fm;
while ((fm = funcParamRegex.exec(source)) !== null) {
  const params = fm[1].split(',').map(p => p.trim()).filter(p => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p));
  for (const p of params) {
    if (p && !paramNames.includes(p)) paramNames.push(p);
  }
}
if (paramNames.length > 0) {
  const decls = paramNames.map(n => `let ${n};`).join('\n') + '\n';
  preprocessed = decls + source;
}

const errors = analyze(preprocessed);

const report = {
  compilationStatus: errors.length > 0 ? 'failed' : 'success',
  semanticErrors: errors.length > 0,
  errorCount: errors.length,
  errors: errors,
  analysisStage: 'semantic',
  inputFile: path.basename(srcPath),
  timestamp: new Date().toISOString()
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Compiler report written to report/compiler-report.json');
process.exit(0);
