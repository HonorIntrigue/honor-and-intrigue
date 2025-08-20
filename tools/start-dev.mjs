#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';

if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
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

const args = ['yarn dev:code', 'yarn dev:css', `node "${foundryPath}" --dataPath="${dataPath}" --hotReload --noupnp`];

spawn('npx', ['concurrently', ...args.map(arg => `"${arg}"`)], {
  cwd: process.cwd(),
  shell: true,
  stdio: 'inherit',
});
