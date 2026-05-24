#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const XPI_NAME = 'copy-message-id@j.kahn.xpi';
const FILES = [
  'manifest.json',
  'background.js',
  'popup',
  'options',
  'icons',
  'LICENSE'
];

const SEVENZIP_DEFAULT_PATHS = [
  'C:\\Program Files\\7-Zip\\7z.exe',
  'C:\\Program Files (x86)\\7-Zip\\7z.exe',
];

// Use 7-Zip (available on most Windows systems) or fall back to zip
function getZipCommand() {
  try {
    execSync('where 7z', { stdio: 'pipe' });
    return '7z';
  } catch {}

  for (const p of SEVENZIP_DEFAULT_PATHS) {
    if (fs.existsSync(p)) return `"${p}"`;
  }

  try {
    execSync('where zip', { stdio: 'pipe' });
    return 'zip';
  } catch {}

  throw new Error('Neither 7-Zip nor zip found. Install 7-Zip from https://www.7-zip.org');
}

function buildXpi() {
  console.log(`Building ${XPI_NAME}...`);

  // Check if all files exist
  for (const file of FILES) {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }
  }

  // Remove old XPI if it exists
  if (fs.existsSync(XPI_NAME)) {
    fs.unlinkSync(XPI_NAME);
  }

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
