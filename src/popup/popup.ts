/**
 * Popup logic: bind the on/off toggle to the `enabled` flag and display the
 * ads-blocked counters (session + lifetime) read from the service worker.
 */

import { getEnabled, setEnabled, requestCounts } from '../shared/storage';

const toggle = document.getElementById('toggle') as HTMLInputElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const statusSub = document.getElementById('status-sub') as HTMLElement;
const sessionCountEl = document.getElementById('session-count') as HTMLElement;
const lifetimeCountEl = document.getElementById('lifetime-count') as HTMLElement;

function renderStatus(enabled: boolean): void {
  document.body.classList.toggle('is-off', !enabled);
  statusText.textContent = enabled ? 'Blocking ads' : 'Paused';
  statusSub.textContent = enabled
    ? 'Ads are being removed'
    : 'Ads will play normally';
}

async function loadCounts(): Promise<void> {
  const { sessionCount, lifetimeCount } = await requestCounts();
  sessionCountEl.textContent = sessionCount.toLocaleString();
  lifetimeCountEl.textContent = lifetimeCount.toLocaleString();
}

async function init(): Promise<void> {
  const enabled = await getEnabled();
  toggle.checked = enabled;
  renderStatus(enabled);
  await loadCounts();

  toggle.addEventListener('change', async () => {
    await setEnabled(toggle.checked);
    renderStatus(toggle.checked);
  });
}

void init();
