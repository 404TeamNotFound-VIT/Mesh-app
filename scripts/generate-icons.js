import fs from 'fs';
import path from 'path';

// Artifact image path
const src = 'C:\\Users\\husainhg\\.gemini\\antigravity-ide\\brain\\388f7cbf-3a15-4827-9917-ecc08402c2e4\\mesh_icon_1788800223611.jpg';
const destDir = path.join(process.cwd(), 'public', 'icons');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(src, path.join(destDir, 'icon-192.png'));
fs.copyFileSync(src, path.join(destDir, 'icon-512.png'));
console.log('Icons copied successfully!');
