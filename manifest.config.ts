import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

/**
 * MV3 manifest for Browser & YouTube Ad Blocker.
 *
 * Combines:
 *  1. Browser-wide network blocking via declarativeNetRequest
 *  2. Universal cosmetic CSS injection across all websites (<all_urls>)
 *  3. Specialized YouTube video ad fast-forward & anti-adblock dismissal
 */
export default defineManifest({
  manifest_version: 3,
  name: 'Browser & YouTube Ad Blocker',
  version: pkg.version,
  description: pkg.description,
  icons: {
    16: 'icons/icon-16.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_icon: {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    // 1. Universal cosmetic hiding for all websites
    {
      matches: ['<all_urls>'],
      css: ['src/content/generic-cosmetic.css'],
      run_at: 'document_start',
      all_frames: true,
    },
    // 2. Specialized YouTube video player skipper & anti-adblock handler
    {
      matches: ['*://*.youtube.com/*'],
      js: ['src/content/index.ts'],
      css: ['src/content/cosmetic.css'],
      run_at: 'document_start',
      all_frames: true,
    },
  ],
  permissions: ['storage', 'declarativeNetRequest'],
  host_permissions: ['<all_urls>'],
  declarative_net_request: {
    rule_resources: [
      {
        id: 'ad-domains',
        enabled: true,
        path: 'rules/ad-domains.json',
      },
    ],
  },
});
