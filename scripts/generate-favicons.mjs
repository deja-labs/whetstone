#!/usr/bin/env node
/**
 * Generate favicon and icon assets from the source SVG logo.
 *
 * Produces:
 *   assets/favicon/favicon.ico        (16+32+48 multi-size)
 *   assets/favicon/favicon-16x16.png
 *   assets/favicon/favicon-32x32.png
 *   assets/favicon/favicon-48x48.png
 *   assets/favicon/apple-touch-icon.png (180×180)
 *   assets/favicon/og-image.png         (1280×640, social/repo card)
 *
 * Usage: node scripts/generate-favicons.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_SVG = resolve(ROOT, 'assets/logo/whetstone-logo.svg');
const OUT_DIR = resolve(ROOT, 'assets/favicon');

mkdirSync(OUT_DIR, { recursive: true });

const svgBuffer = readFileSync(SRC_SVG);

// ---------- Square icons (favicon sizes + apple-touch-icon) ----------

const squareSizes = [16, 32, 48, 180];

for (const size of squareSizes) {
  const png = await sharp(svgBuffer, { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();

  const name = size === 180
    ? 'apple-touch-icon.png'
    : `favicon-${size}x${size}.png`;
  writeFileSync(resolve(OUT_DIR, name), png);
  console.log(`  ✓ ${name}`);
}

// ---------- favicon.ico (multi-size) ----------

const icoSizes = [16, 32, 48];
const icoPngs = [];
for (const size of icoSizes) {
  icoPngs.push(readFileSync(resolve(OUT_DIR, `favicon-${size}x${size}.png`)));
}
const ico = await pngToIco(icoPngs);
writeFileSync(resolve(OUT_DIR, 'favicon.ico'), ico);
console.log('  ✓ favicon.ico');

// ---------- OG / social image (1280×640) ----------

// Center the logo (square) on a dark background with padding
const ogWidth = 1280;
const ogHeight = 640;
const logoSize = 400; // logo rendered at this size, centered

const logoPng = await sharp(svgBuffer, { density: 300 })
  .resize(logoSize, logoSize)
  .png()
  .toBuffer();

const ogImage = await sharp({
  create: {
    width: ogWidth,
    height: ogHeight,
    channels: 4,
    background: { r: 23, g: 23, b: 23, alpha: 1 }, // near-black
  },
})
  .composite([
    {
      input: logoPng,
      left: Math.round((ogWidth - logoSize) / 2),
      top: Math.round((ogHeight - logoSize) / 2),
    },
  ])
  .png()
  .toBuffer();

writeFileSync(resolve(OUT_DIR, 'og-image.png'), ogImage);
console.log('  ✓ og-image.png (1280×640)');

console.log(`\nDone! Assets in ${OUT_DIR}`);
