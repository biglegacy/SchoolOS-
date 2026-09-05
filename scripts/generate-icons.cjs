const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Exact vector path for bold uppercase 'S' centered in a 512x512 canvas
const pathD = 'M354.82 202.72L304.42 202.72Q301.54 161.68 249.34 161.68Q228.46 161.68 216.22 170.50Q203.98 179.32 203.98 194.08Q203.98 208.48 214.42 215.50Q224.86 222.52 253.66 228.28L294.70 236.20Q331.06 243.40 347.62 260.50Q364.18 277.60 364.18 308.56Q364.18 348.52 335.74 371.02Q307.30 393.52 256.54 393.52Q206.14 393.52 178.24 371.20Q150.34 348.88 147.82 306.76L200.38 306.76Q201.82 328 216.94 339.16Q232.06 350.32 259.42 350.32Q283.90 350.32 298.12 340.96Q312.34 331.60 312.34 315.04Q312.34 299.20 301.18 290.56Q290.02 281.92 263.02 276.88L226.30 269.68Q186.34 262.12 169.42 245.92Q152.50 229.72 152.50 199.12Q152.50 160.60 178.60 139.54Q204.70 118.48 251.86 118.48Q265.54 118.48 278.32 120.28Q291.10 122.08 305.50 127.66Q319.90 133.24 330.34 142.06Q340.78 150.88 347.80 166.54Q354.82 182.20 354.82 202.72Z';

// Solid green background - Clean, modern, professional SaaS green
const BRAND_GREEN = '#16a34a'; // Vibrant solid emerald/green (RGB 22, 163, 74)

// Standard SVG with full bleed background
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${BRAND_GREEN}"/>
  <path fill="#ffffff" d="${pathD}"/>
</svg>`;

// Maskable SVG with safe margin for Android adaptive icons (scaled to 76% centered)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${BRAND_GREEN}"/>
  <g transform="translate(61.44, 61.44) scale(0.76)">
    <path fill="#ffffff" d="${pathD}"/>
  </g>
</svg>`;

async function buildIcons() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write vector SVGs
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), standardSvg, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg, 'utf8');
  console.log('✓ Wrote favicon.svg and icon.svg');

  // 2. Render raster PNGs
  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  const pngSizes = [
    { name: 'favicon-16x16.png', size: 16, buffer: standardBuffer },
    { name: 'favicon-32x32.png', size: 32, buffer: standardBuffer },
    { name: 'favicon-48x48.png', size: 48, buffer: standardBuffer },
    { name: 'apple-touch-icon.png', size: 180, buffer: standardBuffer },
    { name: 'apple-touch-icon-180x180.png', size: 180, buffer: standardBuffer },
    { name: 'icon-192.png', size: 192, buffer: standardBuffer },
    { name: 'icon-512.png', size: 512, buffer: standardBuffer },
    { name: 'icon-maskable-512.png', size: 512, buffer: maskableBuffer },
  ];

  const pngBuffers = {};

  for (const item of pngSizes) {
    const rendered = await sharp(item.buffer)
      .resize(item.size, item.size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    
    fs.writeFileSync(path.join(publicDir, item.name), rendered);
    pngBuffers[item.size] = rendered;
    console.log(`✓ Rendered ${item.name} (${item.size}x${item.size}, ${rendered.length} bytes)`);
  }

  // 3. Construct multi-resolution favicon.ico (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const headerLength = 6;
  const entryLength = 16;
  let offset = headerLength + entryLength * count;

  const icoHeader = Buffer.alloc(headerLength);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type 1 = ICO
  icoHeader.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  const imageBuffers = [];

  for (const s of icoSizes) {
    const png = pngBuffers[s];
    const entry = Buffer.alloc(entryLength);
    entry.writeUInt8(s >= 256 ? 0 : s, 0); // width
    entry.writeUInt8(s >= 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image byte size
    entry.writeUInt32LE(offset, 12); // image offset in file

    dirEntries.push(entry);
    imageBuffers.push(png);
    offset += png.length;
  }

  const icoBuffer = Buffer.concat([icoHeader, ...dirEntries, ...imageBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(`✓ Generated multi-resolution favicon.ico (${icoBuffer.length} bytes)`);

  console.log('All SchoolOS icons successfully generated in /public!');
}

buildIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
