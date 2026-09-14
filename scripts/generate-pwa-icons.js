import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  console.log('Generating PWA icons from public/icon.svg...');
  
  // 192x192 standard icon
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 512x512 standard icon
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 180x180 Apple Touch Icon (iOS Safari compliant)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 512x512 Maskable Icon with 10% safe zone padding for Android squircles/circles
  await sharp(svgBuffer)
    .resize(410, 410)
    .flatten({ background: { r: 13, g: 27, b: 61 } }) // fill icon corner transparency with navy
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 13, g: 27, b: 61, alpha: 1 } // #0D1B3D (matches icon background)
    })
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  // Favicon 64x64 PNG as fallback
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.resolve('public/favicon.ico'));
  console.log('Created public/favicon.ico');

  console.log('All PWA assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
