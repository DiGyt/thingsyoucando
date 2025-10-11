import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = './docs/posts';          // ✅ was ./public/posts
const outputFile = './docs/posts-index.json';  // ✅ was ./posts-index.json

const postsIndex = [];

fs.readdirSync(postsDir).forEach(file => {
  if (file.endsWith('.md')) {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const { data } = matter(content);

    postsIndex.push({
      id: file.replace('.md', ''),
      title: data.title,
      country: data.country,
      time: data.time,
      online: data.online,
      capabilities: data.capabilities || [],
      interests: data.interests || []
    });
  }
});

fs.writeFileSync(outputFile, JSON.stringify(postsIndex, null, 2));
console.log(`Generated ${outputFile} with ${postsIndex.length} posts.`);
