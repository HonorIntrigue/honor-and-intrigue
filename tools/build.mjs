#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Clean public/ (preserve packs)
if (fs.existsSync('public')) {
  for (const entry of fs.readdirSync('public')) {
    if (entry === 'packs') continue;
    fs.rmSync(path.join('public', entry), { recursive: true, force: true });
  }
}

// Copy static assets to public/
const copies = [
  ['static/assets', 'public/assets'],
  ['static/lang', 'public/lang'],
  ['static/templates', 'public/templates'],
  ['static/system.json', 'public/system.json'],
];

for (const [src, dest] of copies) {
  fs.cpSync(src, dest, { recursive: true });
}

// Ensure public/css exists
fs.mkdirSync('public/css', { recursive: true });

// Run code, css, and packs builds in parallel
execSync('npx concurrently "pnpm build:code" "pnpm build:css" "pnpm build:packs"', {
  stdio: 'inherit',
  shell: true,
});
