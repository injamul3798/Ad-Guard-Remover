import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, '..', 'dist', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

// 1. Add IIFE YouTube content script to the YouTube-only entry
for (const cs of manifest.content_scripts ?? []) {
  if (cs.matches?.some(m => m.includes('youtube.com'))) {
    cs.js ??= [];
    if (!cs.js.includes('assets/content-script.js')) {
      cs.js.unshift('assets/content-script.js');
    }
  }
}

// 2. Prepend popup-blocker as a MAIN-world script on all URLs.
//    Must run at document_start so it overrides window.open before page scripts load.
const alreadyAdded = manifest.content_scripts?.some(cs =>
  cs.js?.includes('assets/popup-blocker.js')
);
if (!alreadyAdded) {
  manifest.content_scripts = [
    {
      matches: ['<all_urls>'],
      js: ['assets/popup-blocker.js'],
      world: 'MAIN',
      run_at: 'document_start',
      all_frames: true,
    },
    ...(manifest.content_scripts ?? []),
  ];
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('✓ Manifest patched: content-script.js + popup-blocker.js (MAIN world) added.');
