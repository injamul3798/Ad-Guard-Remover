/**
 * Shared types + typed chrome.storage helpers and the message contract used
 * between the content script, the popup, and the background service worker.
 *
 * Counters live in the background/service-worker (single writer, avoids races).
 * The `enabled` flag lives in chrome.storage.local so both the popup and every
 * content-script instance can read it and react to changes via onChanged.
 */

export interface Settings {
  /** Master on/off switch. When false the ad engine is inert. */
  enabled: boolean;
  /** Total ads skipped across all time. */
  lifetimeCount: number;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  lifetimeCount: 0,
};

const STORAGE_KEYS = ['enabled', 'lifetimeCount'] as const;

/** Read the full settings object, filling in defaults for anything unset. */
export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS as unknown as string[]);
  return {
    enabled: stored.enabled ?? DEFAULT_SETTINGS.enabled,
    lifetimeCount: stored.lifetimeCount ?? DEFAULT_SETTINGS.lifetimeCount,
  };
}

/** Read only the enabled flag (hot path for the content script). */
export async function getEnabled(): Promise<boolean> {
  const { enabled } = await chrome.storage.local.get('enabled');
  return enabled ?? DEFAULT_SETTINGS.enabled;
}

export async function setEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ enabled });
}

export async function setLifetimeCount(lifetimeCount: number): Promise<void> {
  await chrome.storage.local.set({ lifetimeCount });
}

/**
 * Subscribe to changes in the enabled flag. Returns an unsubscribe function.
 * Used by the content script to start/stop without a page reload.
 */
export function onEnabledChanged(cb: (enabled: boolean) => void): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: string,
  ) => {
    if (area === 'local' && changes.enabled) {
      cb(changes.enabled.newValue ?? DEFAULT_SETTINGS.enabled);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

/* ------------------------------------------------------------------ *
 * Messaging: content script -> background service worker
 * ------------------------------------------------------------------ */

export type RuntimeMessage =
  /** Content script skipped one ad; background increments the counter. */
  | { type: 'AD_SKIPPED' }
  /** Popup (or anyone) asks the background for current counts. */
  | { type: 'GET_COUNTS' };

export interface CountsResponse {
  /** Ads skipped since the service worker last started (this browser session). */
  sessionCount: number;
  lifetimeCount: number;
}

/** Fire-and-forget notification that an ad was skipped. */
export function reportAdSkipped(): void {
  const msg: RuntimeMessage = { type: 'AD_SKIPPED' };
  // Swallow errors: the service worker may be asleep or the context invalidated
  // during navigation. It will wake on the next message.
  void chrome.runtime.sendMessage(msg).catch(() => {});
}

/** Ask the background service worker for the current counts. */
export async function requestCounts(): Promise<CountsResponse> {
  const msg: RuntimeMessage = { type: 'GET_COUNTS' };
  try {
    return (await chrome.runtime.sendMessage(msg)) as CountsResponse;
  } catch {
    return { sessionCount: 0, lifetimeCount: 0 };
  }
}
