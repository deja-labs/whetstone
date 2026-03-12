#!/usr/bin/env node
/**
 * Generate logo concepts using Recraft V4 Vector API.
 * Requires RECRAFT_API_KEY in .env
 *
 * Usage: node scripts/generate-logos.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'assets/logo-concepts/recraft');

// Load .env
const envPath = resolve(ROOT, '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
    .filter(([k, v]) => k && v)
);

const API_KEY = envVars.RECRAFT_API_KEY;
if (!API_KEY) {
  console.error('Error: RECRAFT_API_KEY not set in .env');
  process.exit(1);
}

const API_BASE = 'https://external.api.recraft.ai/v1';

const prompts = [
  {
    name: 'honing-circle',
    prompt: 'Bold modern logo mark. A circular shape with a sharp diagonal blade stroke cutting through it, suggesting sharpening motion. Amber orange on dark background. Strong geometric, minimal, powerful. Icon only, no text, no letters. Flat vector.',
  },
  {
    name: 'honing-diagonal',
    prompt: 'Bold modern logo mark. A diagonal blade shape being sharpened, with motion lines or sparks suggesting the honing action. Dynamic angle, amber orange on dark background. Strong, geometric, minimal. Icon only, no text, no letters. Flat vector.',
  },
];

async function generate(promptConfig) {
  console.log(`Generating: ${promptConfig.name}...`);

  const body = {
    prompt: promptConfig.prompt,
    model: 'recraftv4_vector',
    n: 4,
    size: '1024x1024',
    response_format: 'url',
    controls: {
      colors: [{ rgb: [245, 158, 11] }], // amber-500
    },
  };

  const res = await fetch(`${API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  Error (${res.status}): ${text}`);
    return;
  }

  const data = await res.json();
  console.log(`  Got ${data.data.length} results`);

  for (let i = 0; i < data.data.length; i++) {
    const url = data.data[i].url;
    const filename = `${promptConfig.name}-${i + 1}.svg`;
    const filepath = resolve(OUT_DIR, filename);

    // Download the SVG
    const svgRes = await fetch(url);
    const svgContent = await svgRes.text();
    writeFileSync(filepath, svgContent);
    console.log(`  Saved: ${filename}`);
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUT_DIR}\n`);

  for (const p of prompts) {
    await generate(p);
    console.log();
  }

  console.log('Done! Check assets/logo-concepts/recraft/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
