import fs from 'fs';
import path from 'path';

function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      checkDir(fullPath);
    } else if (file.endsWith('.jsx')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      
      // Extract all imports
      const importedNames = new Set();
      const importRegex = /import\s+([\s\S]*?)\s+from\s+['"][^'"]+['"]/g;
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        const clause = match[1];
        // Named imports { A, B as C }
        const namedMatch = clause.match(/\{([\s\S]*?)\}/);
        if (namedMatch) {
          namedMatch[1].split(',').forEach(s => {
            const item = s.trim().split(/\s+as\s+/);
            const name = item[item.length - 1].trim();
            if (name) importedNames.add(name);
          });
        }
        // Default import
        const defaultMatch = clause.replace(/\{[\s\S]*?\}/, '').trim();
        if (defaultMatch) {
          defaultMatch.split(',').forEach(s => {
            const name = s.trim();
            if (name) importedNames.add(name);
          });
        }
      }

      // Also standard React / HTML / local declarations
      const declaredRegex = /(?:function|const|let|var|class)\s+([A-Za-z0-9_]+)/g;
      while ((match = declaredRegex.exec(code)) !== null) {
        importedNames.add(match[1]);
      }

      // Find JSX tags <Component ... or <Component>
      const jsxRegex = /<([A-Z][A-Za-z0-9_]*)/g;
      while ((match = jsxRegex.exec(code)) !== null) {
        const comp = match[1];
        if (!importedNames.has(comp)) {
          console.log(`[MISSING IMPORT] In ${fullPath}: <${comp} /> is used but not imported!`);
        }
      }
    }
  }
}

checkDir('frontend/src');
console.log('JSX Import validation completed.');
