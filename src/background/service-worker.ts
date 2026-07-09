/**
 * Background service worker.
 *
 * Single writer for the ads-blocked counters:
 *   - lifetimeCount is persisted in chrome.storage.local.
 *   - sessionCount lives in memory and resets whenever the worker restarts
 *     (roughly "this browser session").
 * Also mirrors the lifetime count onto the toolbar badge.
 *
 * MV3 service workers are ephemeral, so in-memory state must be re-hydrated on
 * every wake-up. sessionCount intentionally is NOT persisted.
 */

import {
  DEFAULT_SETTINGS,
  getSettings,
  setLifetimeCount,
  type RuntimeMessage,
  type CountsResponse,
} from '../shared/storage';

let sessionCount = 0;

async function initBadge(): Promise<void> {
  const { lifetimeCount } = await getSettings();
  await updateBadge(lifetimeCount);
}

async function updateBadge(lifetimeCount: number): Promise<void> {
  const text = lifetimeCount > 0 ? formatBadge(lifetimeCount) : '';
  await chrome.action.setBadgeBackgroundColor({ color: '#c00' });
  await chrome.action.setBadgeText({ text });
}

/** Keep the badge readable: 999 -> "999", 1500 -> "1.5k". */
function formatBadge(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

async function handleAdSkipped(): Promise<void> {
  sessionCount += 1;
  const { lifetimeCount } = await getSettings();
  const next = lifetimeCount + 1;
  await setLifetimeCount(next);
  await updateBadge(next);
}

// Seed defaults on install so the toggle starts in a known state.
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(['enabled', 'lifetimeCount']);
  await chrome.storage.local.set({
    enabled: current.enabled ?? DEFAULT_SETTINGS.enabled,
    lifetimeCount: current.lifetimeCount ?? DEFAULT_SETTINGS.lifetimeCount,
  });
  await initBadge();
});

chrome.runtime.onStartup.addListener(() => {
  void initBadge();
});

// Also initialize on cold worker wake (covers dev reloads).
void initBadge();

chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'AD_SKIPPED':
        void handleAdSkipped();
        return false; // no response needed

      case 'GET_COUNTS':
        void (async () => {
          const { lifetimeCount } = await getSettings();
          const response: CountsResponse = { sessionCount, lifetimeCount };
          sendResponse(response);
        })();
        return true; // async response

      default:
        return false;
    }
  },
);
