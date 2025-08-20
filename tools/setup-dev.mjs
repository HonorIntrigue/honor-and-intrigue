#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { askQuestion } from './askQuestion.mjs';

const installPath = await askQuestion('Enter the absolute path to your Foundry application (main.js): ');
let dataPath = await askQuestion('Enter the absolute path to your Foundry data directory (containing the "Data" directory): ');

if (!installPath || !dataPath) {
  console.error('❌ Unable to acquire Foundry paths, process interrupted.');
  process.exit(1);
}

if (/\bData$/.test(dataPath)) {
  dataPath = dataPath.slice(0, -4);
}

console.log('Generating .env file...');

const envContent = `FOUNDRY_APPLICATION_PATH=${installPath}
FOUNDRY_DATA_PATH=${dataPath}
`;

fs.writeFileSync('.env', envContent);

console.log('Creating system symlink...');
const symlinkPath = path.resolve(dataPath, 'Data', 'systems', 'honor-and-intrigue');

if (!symlinkPath) {
  console.error(`❌ Could not resolve path to Data/systems folder at "${dataPath}"`);
  process.exit(1);
}

const symlinkStats = fs.lstatSync(symlinkPath, { throwIfNoEntry: false });

if (symlinkStats) {
  const atPath = symlinkStats.isDirectory() ? 'folder' : symlinkStats.isSymbolicLink() ? 'symlink' : 'file';
  const proceed = (await askQuestion(`An "honor-and-intrigue" ${atPath} already exists in the systems directory. Replace with new symlink (y/n)? `)).toLowerCase() === 'y';

  if (!proceed) {
    console.log('❌ Aborting');
    process.exit(1);
  }
}

try {
  if (symlinkStats?.isDirectory()) {
    fs.rmSync(symlinkPath, { recursive: true, force: true });
  } else if (symlinkStats) {
    fs.unlinkSync(symlinkPath);
  }

  fs.symlinkSync(path.resolve(process.cwd(), 'public'), symlinkPath);
} catch(err) {
  if (err instanceof Error) {
    console.error(`❌ An error was encountered trying to create a symlink: ${err.message}`);
    process.exit(1);
  }
}

console.log('✅ Development environment configured!');
