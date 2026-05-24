#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { buildXpi } = require('./build.js');

const TB_DEFAULT_PATHS = [
  'C:\\Program Files\\Mozilla Thunderbird\\thunderbird.exe',
  'C:\\Program Files (x86)\\Mozilla Thunderbird\\thunderbird.exe',
  '/usr/bin/thunderbird',
  '/usr/local/bin/thunderbird',
  '/Applications/Thunderbird.app/Contents/MacOS/thunderbird',
];

function killThunderbird() {
  try {
    if (isWindows) {
      execSync('taskkill /IM thunderbird.exe /F', { stdio: 'pipe' });
    } else {
      execSync('pkill -x thunderbird', { stdio: 'pipe' });
    }
    // Give it a moment to release file locks
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    return true;
  } catch {
    return false; // not running
  }
}

function findThunderbird() {
  // Check PATH first
  try {
    const cmd = isWindows ? 'where thunderbird' : 'which thunderbird';
    return execSync(cmd, { stdio: 'pipe' }).toString().trim().split('\n')[0].trim();
  } catch {}
  // Fall back to default install locations
  for (const p of TB_DEFAULT_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const ADDON_ID = 'copy-message-id@j.kahn';
const XPI_FILE = 'copy-message-id@j.kahn.xpi';
const PROFILE_NAME = 'thunderbird-test';

const isWindows = process.platform === 'win32';

function log(msg)  { console.log(`\x1b[34m${msg}\x1b[0m`); }
function ok(msg)   { console.log(`\x1b[32m✓ ${msg}\x1b[0m`); }
function info(msg) { console.log(`\x1b[33m→ ${msg}\x1b[0m`); }

// Step 1: Build XPI
log('Step 1: Building XPI');
try { fs.unlinkSync(XPI_FILE); } catch {}
buildXpi();
ok(`XPI built: ${XPI_FILE}\n`);

// Step 2: Find or create Thunderbird profile
log('Step 2: Setting up Thunderbird profile');
const tbProfilesDir = isWindows
  ? path.join(process.env.APPDATA, 'Thunderbird')
  : path.join(process.env.HOME, '.thunderbird');
const profileDir = path.join(tbProfilesDir, PROFILE_NAME);
fs.mkdirSync(profileDir, { recursive: true });
ok(`Profile directory: ${profileDir}\n`);

// Step 3: Install addon by dropping XPI into extensions folder
log('Step 3: Installing addon');
if (killThunderbird()) info('Closed running Thunderbird instance');
const extDir = path.join(profileDir, 'extensions');
fs.mkdirSync(extDir, { recursive: true });
// Remove any previous unpacked install
const addonDir = path.join(extDir, ADDON_ID);
if (fs.existsSync(addonDir)) fs.rmSync(addonDir, { recursive: true });
fs.copyFileSync(XPI_FILE, path.join(extDir, `${ADDON_ID}.xpi`));
ok(`Addon XPI copied to: ${extDir}\n`);

// Step 4: Create prefs.js if needed
log('Step 4: Setting up profile configuration');
const prefsFile = path.join(profileDir, 'prefs.js');
  fs.writeFileSync(prefsFile, [
    'user_pref("extensions.activeThemeID", "firefox-compact-dark@mozilla.org");',
    'user_pref("extensions.autoDisableScopes", 0);',
    'user_pref("mail.accountmanager.accounts", "account1");',
    'user_pref("mail.account.account1.server", "server1");',
    'user_pref("mail.server.server1.type", "none");',
    'user_pref("mail.server.server1.hostname", "Local Folders");',
    'user_pref("mail.server.server1.username", "");',
    'user_pref("mail.server.server1.directory-rel", "[ProfD]Mail/Local Folders");',
    'user_pref("mail.server.server1.name", "Local Folders");',
    'user_pref("mail.server.server1.port", 143);',
    'user_pref("mail.server.server1.socketType", 0);',
  ].join('\n') + '\n');
  ok('Wrote prefs.js');
console.log();

// Step 5: Create test email files from tests/ directory
log('Step 5: Setting up test email files');
const mailDir = path.join(profileDir, 'Mail', 'Local Folders');
fs.mkdirSync(mailDir, { recursive: true });
const inboxFile = path.join(mailDir, 'INBOX');
const emlFiles = fs.readdirSync('tests').filter(f => f.endsWith('.eml')).sort();
const mbox = emlFiles.map(f => {
  const content = fs.readFileSync(path.join('tests', f), 'utf8').replace(/\r\n/g, '\n');
  return `From test@example.com Mon Jan 01 00:00:00 2024\n${content}`;
}).join('\n');
fs.writeFileSync(inboxFile, mbox);
ok(`Wrote test INBOX (${emlFiles.length} messages)`);
console.log();

// Step 6: Launch Thunderbird
log('Step 6: Launching Thunderbird');
const tbExe = findThunderbird();
if (tbExe) {
  ok(`Found Thunderbird: ${tbExe}`);
  console.log();
  spawn(tbExe, ['-profile', profileDir], { detached: true, stdio: 'ignore' }).unref();
  ok('Thunderbird launched with test profile');
} else {
  console.log('\x1b[33m⚠ Thunderbird not found. Launch it manually with:\x1b[0m');
  console.log(`  thunderbird.exe -profile "${profileDir}"`);
}
console.log();
console.log('Open a message from the Local Folders inbox and click \'Copy Message ID\' to test.');
