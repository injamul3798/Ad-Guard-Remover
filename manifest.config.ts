import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

/**
 * MV3 manifest. Chrome-only for v1 (ports to Edge/Brave with no code change).
 *
 * The content script is injected at document_start so the ad engine is running
 * before YouTube's player initializes. `all_frames` covers embedded players.
 */
export default defineManifest({
  manifest_version: 3,
  name: 'YouTube Ad Remover',
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
    {
      matches: ['*://*.youtube.com/*'],
      js: ['src/content/index.ts'],
      css: ['src/content/cosmetic.css'],
      run_at: 'document_start',
      all_frames: true,
    },
  ],
  permissions: ['storage', 'declarativeNetRequest'],
  host_permissions: ['*://*.youtube.com/*'],
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
