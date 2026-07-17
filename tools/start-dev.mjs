#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';

if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach((line) => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value;
    }
  });
}

const foundryPath = process.env.FOUNDRY_APPLICATION_PATH;
const dataPath = process.env.FOUNDRY_DATA_PATH;

if (!foundryPath || !dataPath) {
  throw 'Could not find Foundry application and/or data path';
}

const args = [
  'pnpm run dev:code',
  'pnpm run dev:css',
  `npx wait-on file:./public/honor-and-intrigue.mjs file:./public/css/honor-and-intrigue.css && node "${foundryPath}" --dataPath="${dataPath}" --hotReload --noupnp --world="hidev"`,
];

spawn(`npx concurrently -n "code,css,fvtt" -c "blue,magenta,yellow" ${args.map((arg) => `"${arg}"`).join(' ')}`, {
  cwd: process.cwd(),
  shell: true,
  stdio: 'inherit',
});
