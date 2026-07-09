/**
 * Content-script bootstrap.
 *
 * Reads the enabled flag, starts/stops the ad engine accordingly, and reacts
 * live to toggle changes from the popup (no page reload needed).
 */

import { AdSkipper } from './ad-skipper';
import { AntiAdblock } from './anti-adblock';
import { getEnabled, onEnabledChanged } from '../shared/storage';

const skipper = new AdSkipper();
const antiAdblock = new AntiAdblock();
let running = false;

function startEngine(): void {
  if (running) return;
  running = true;
  skipper.start();
  antiAdblock.start();
}

function stopEngine(): void {
  if (!running) return;
  running = false;
  skipper.stop();
  antiAdblock.stop();
}

async function init(): Promise<void> {
  const enabled = await getEnabled();
  if (enabled) startEngine();

  onEnabledChanged((nowEnabled) => {
    if (nowEnabled) startEngine();
    else stopEngine();
  });
}

void init();
