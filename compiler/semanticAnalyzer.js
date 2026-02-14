// Simple semantic analyzer
// Rule: If a variable is used before declaration, report a semantic error

function analyze(source) {
  const errors = [];
  const declared = new Set();

  // Keyword / builtin whitelist to ignore
  const ignore = new Set([
    'let','var','const','function','return','console','log','if','else','for','while','true','false','null','undefined'
  ]);

  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Ignore full-line single-line comments
    if (line.trim().startsWith('//')) continue;

    // Remove inline single-line comments
    line = line.replace(/\/\/.*$/, '');

    // Remove string literals (simple approach) to avoid false positives inside strings
    line = line.replace(/(['"`])(\\.|(?!\1).)*\1/g, ' ');

    // Capture function declarations: function name(...) { }
    const funcMatch = line.match(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
    if (funcMatch) {
      declared.add(funcMatch[1]);
    }

    // Capture variable declarations (let/var/const) and register all declared identifiers on the line
    const declaredThisLine = new Set();
    const declRegex = /(?:^|[^A-Za-z0-9_$])(let|var|const)\s+([^;]+)/g;
    let m;
    while ((m = declRegex.exec(line)) !== null) {
      const declPart = m[2];
      // split by comma to handle multiple declarations: let a, b = 2
      const parts = declPart.split(',');
      for (const part of parts) {
        const idMatch = part.trim().match(/^([A-Za-z_$][A-Za-z0-9_$]*)/);
        if (idMatch) {
          declared.add(idMatch[1]);
          declaredThisLine.add(idMatch[1]);
        }
      }
    }

    // Find identifier uses
    const idRegex = /[A-Za-z_$][A-Za-z0-9_$]*/g;
    let im;
    while ((im = idRegex.exec(line)) !== null) {
      const name = im[0];

      // Ignore keywords and whitelisted builtins
      if (ignore.has(name)) continue;

      // Ignore identifiers that are declared (including those declared on this line)
      if (declared.has(name) || declaredThisLine.has(name)) continue;

      // Ignore member property access (obj.prop) by checking previous character
      const idx = im.index;
      const prevChar = idx > 0 ? line[idx - 1] : null;
      if (prevChar === '.') continue;

      // Report a semantic error: variable used before declaration
      errors.push({ type: 'SemanticError', description: `Variable '${name}' used before declaration`, lineNumber: i + 1 });
    }
  }

  return errors;
}

module.exports = analyze;
