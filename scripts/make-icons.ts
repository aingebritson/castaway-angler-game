/** Renders the placeholder app icon to the PNG sizes the web app manifest and iOS need. */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(out, { recursive: true });

const svg = (pad: number) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f62b0"/><stop offset="0.55" stop-color="#f59a63"/><stop offset="1" stop-color="#ffd08a"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d6f9c"/><stop offset="1" stop-color="#4ec5bd"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <circle cx="256" cy="262" r="${70 - pad * 0.2}" fill="#fff3c4"/>
  <rect y="270" width="512" height="242" fill="url(#sea)"/>
  <g fill="#fff" opacity=".55">
    <rect x="206" y="292" width="100" height="6" rx="3"/><rect x="186" y="318" width="140" height="7" rx="3.5"/>
    <rect x="220" y="346" width="72" height="7" rx="3.5"/>
  </g>
  <g transform="translate(${96 + pad} ${40 + pad}) scale(${(320 - pad * 2) / 320})">
    <path d="M40 400 C60 300 70 200 120 110" fill="none" stroke="#2c2018" stroke-width="20" stroke-linecap="round"/>
    <g fill="#1f3a2a">
      <path d="M120 110 C60 60 10 80 -10 130 C40 100 80 105 120 110Z"/>
      <path d="M120 110 C90 40 40 20 0 40 C50 50 90 75 120 110Z"/>
      <path d="M120 110 C130 40 180 10 230 20 C180 40 150 70 120 110Z"/>
      <path d="M120 110 C180 70 240 80 270 130 C220 105 170 105 120 110Z"/>
      <path d="M120 110 C160 110 200 140 210 190 C180 150 150 125 120 110Z"/>
    </g>
  </g>
  <g transform="translate(330 330)">
    <line x1="0" y1="-150" x2="0" y2="-34" stroke="#fff" stroke-width="4" opacity=".9"/>
    <ellipse cx="0" cy="0" rx="34" ry="42" fill="#f4efe2"/>
    <path d="M-34 0 A34 42 0 0 1 34 0Z" fill="#d8432f"/>
    <rect x="-4" y="-56" width="8" height="18" rx="3" fill="#2a2a2a"/>
    <ellipse cx="0" cy="46" rx="58" ry="12" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>
  </g>
</svg>`;

async function render(name: string, size: number, pad = 0) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(`${out}${name}`);
  console.log(`  ${name} ${size}px`);
}

await render('icon-192.png', 192);
await render('icon-512.png', 512);
await render('icon-maskable-512.png', 512, 40);
await render('apple-touch-icon.png', 180);
