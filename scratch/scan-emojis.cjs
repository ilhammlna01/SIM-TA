const fs = require('fs');
const path = require('path');

// Unicode ranges for emojis and symbols
const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u203C\u2049\u2139\u2194-\u2199\u21A9-\u21AA\u231A-\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA-\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u27EF\u2934-\u2935\u2B05-\u2B07\u2B1B-\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299])/u;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Skip comment-only lines if needed, but let's see all
        if (emojiRegex.test(line)) {
          results.push({ file: fullPath, line: idx + 1, text: line.trim() });
        }
      });
    }
  });
  return results;
}

const hits = walk('./src');
console.log('Total emoji hits in src:', hits.length);
hits.forEach(h => console.log(`${h.file}:${h.line} -> ${h.text}`));
