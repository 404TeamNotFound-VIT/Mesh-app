import { Jimp } from 'jimp';
import path from 'path';

async function generateIcons() {
  const srcPath = 'C:\\Users\\husainhg\\.gemini\\antigravity-ide\\brain\\388f7cbf-3a15-4827-9917-ecc08402c2e4\\mesh_icon_1788800223611.jpg';
  const destDir = path.join(process.cwd(), 'public', 'icons');
  
  try {
    const image = await Jimp.read(srcPath);
    
    // Generate 192x192
    const img192 = image.clone();
    img192.resize({ w: 192, h: 192 });
    await img192.write(path.join(destDir, 'icon-192.png'));
    
    // Generate 512x512
    const img512 = image.clone();
    img512.resize({ w: 512, h: 512 });
    await img512.write(path.join(destDir, 'icon-512.png'));
    
    console.log('Successfully generated true PNG icons!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
