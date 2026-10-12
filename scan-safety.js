import fs from 'fs';
import path from 'path';

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Look for property.length, property.map, property.forEach without optional chaining ?.
        // Match patterns like someObj.prop.length or someObj.prop.map
        const dangerousPatterns = [
          /(\w+\.\w+)\.length/g,
          /(\w+\.\w+)\.map\(/g,
          /(\w+\.\w+)\.forEach\(/g,
          /(\w+\.\w+)\.filter\(/g
        ];
        dangerousPatterns.forEach((regex) => {
          let match;
          while ((match = regex.exec(line)) !== null) {
            // Check if not preceded by ?. or Array.isArray or || []
            const fullExpr = match[0];
            if (!line.includes('?.') && !line.includes('|| []') && !line.includes('Array.isArray')) {
              console.log(`${fullPath}:${idx + 1} -> ${line.trim()}`);
            }
          }
        });
      });
    }
  }
}

scanDir('frontend/src/pages');
scanDir('frontend/src/components');
console.log('Scan completed.');
