import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

const postsDir = './docs/posts';
const outputFile = './docs/posts-index.json';

const postsIndex = [];

fs.readdirSync(postsDir).forEach(file => {
  if (file.endsWith('.html')) {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const dom = new JSDOM(content);
    const metadataScript = dom.window.document.querySelector('script.metadata-json');
    if (metadataScript) {
      const data = JSON.parse(metadataScript.textContent);
      postsIndex.push(data);
    }
  }
});

fs.writeFileSync(outputFile, JSON.stringify(postsIndex, null, 2));
console.log(`Generated ${outputFile} with ${postsIndex.length} posts.`);
