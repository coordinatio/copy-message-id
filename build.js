#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ADDON_BASE = 'copy-message-id@j.kahn';
const FILES = [
  'manifest.json',
  'background.js',
  'options',
  'icons',
  'LICENSE'
];

const SEVENZIP_DEFAULT_PATHS = [
  'C:\\Program Files\\7-Zip\\7z.exe',
  'C:\\Program Files (x86)\\7-Zip\\7z.exe',
];

function getXpiName() {
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  const version = manifest.version;

  let dirty = false;
  try {
    const status = execSync('git status --porcelain', { stdio: 'pipe' }).toString().trim();
    dirty = status.length > 0;
  } catch {}

  const suffix = dirty ? '-dev' : '';
  return `${ADDON_BASE}-${version}${suffix}.xpi`;
}

const isWindows = process.platform === 'win32';
const findCmd = isWindows ? 'where' : 'which';

// Use 7-Zip (available on most Windows systems) or fall back to zip
function getZipCommand() {
  try {
    execSync(`${findCmd} 7z`, { stdio: 'pipe' });
    return '7z';
  } catch {}

  for (const p of SEVENZIP_DEFAULT_PATHS) {
    if (fs.existsSync(p)) return `"${p}"`;
  }

  try {
    execSync(`${findCmd} zip`, { stdio: 'pipe' });
    return 'zip';
  } catch {}

  throw new Error('Neither 7-Zip nor zip found. Install 7-Zip from https://www.7-zip.org');
}

function buildXpi() {
  const XPI_NAME = getXpiName();
  console.log(`Building ${XPI_NAME}...`);

  // Check if all files exist
  for (const file of FILES) {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
  }

  // Remove old XPI files before building
  fs.readdirSync('.').filter(f => f.startsWith(ADDON_BASE) && f.endsWith('.xpi')).forEach(f => fs.unlinkSync(f));

  const zipCmd = getZipCommand();
  const fileArgs = FILES.join(' ');

  try {
    if (zipCmd === 'zip') {
      execSync(`zip -r ${XPI_NAME} ${fileArgs}`, { stdio: 'inherit' });
    } else {
      execSync(`${zipCmd} a -tzip ${XPI_NAME} ${fileArgs}`, { stdio: 'inherit' });
    }
    console.log(`✓ ${XPI_NAME} created successfully`);
  } catch (error) {
    throw new Error(`Failed to build XPI: ${error.message}`);
  }
  return XPI_NAME;
}

if (require.main === module) {
  try {
    buildXpi();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
}

module.exports = { buildXpi };
