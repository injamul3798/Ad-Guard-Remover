/**
 * Core ad-skipping engine.
 *
 * Strategy (the technique that actually works on YouTube video ads):
 *   1. Watch the player element for the `ad-showing` / `ad-interrupting` class.
 *   2. When an ad is active, fast-forward it to its end (video.currentTime =
 *      video.duration) and click any "Skip" button that appears.
 *   3. Remove cosmetic ad containers (overlays, banners, companion ads).
 *
 * declarativeNetRequest can't touch these because YouTube serves ads inline /
 * server-side-inserted, so DOM manipulation is the reliable path.
 */

import {
  PLAYER_SELECTOR,
  VIDEO_SELECTOR,
  AD_PLAYING_CLASSES,
  SKIP_BUTTON_SELECTORS,
  AD_CONTAINER_SELECTORS,
} from './selectors';
import { reportAdSkipped } from '../shared/storage';

export class AdSkipper {
  private observer: MutationObserver | null = null;
  private player: HTMLElement | null = null;
  /** Guards against counting the same ad break multiple times as classes toggle. */
  private handlingAd = false;

  start(): void {
    if (this.observer) return; // already running
    this.attachToPlayer();
    // Re-attach after SPA navigations (the player node can be replaced).
    document.addEventListener('yt-navigate-finish', this.onNavigate, true);
    // Sweep cosmetic ad containers on a light interval as a safety net for
    // lazily-inserted feed ads that don't pass through the player observer.
    this.cosmeticInterval = window.setInterval(this.removeCosmeticAds, 1500);
    this.removeCosmeticAds();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.player = null;
    document.removeEventListener('yt-navigate-finish', this.onNavigate, true);
    if (this.cosmeticInterval !== null) {
      clearInterval(this.cosmeticInterval);
      this.cosmeticInterval = null;
    }
  }

  private cosmeticInterval: number | null = null;

  private onNavigate = (): void => {
    this.attachToPlayer();
  };

  /** Locate the player and (re)wire the MutationObserver to it. */
  private attachToPlayer(): void {
    const player = document.querySelector<HTMLElement>(PLAYER_SELECTOR);
    if (!player) {
      // Player not in DOM yet (document_start). Retry shortly.
      window.setTimeout(() => this.attachToPlayer(), 300);
      return;
    }
    if (player === this.player && this.observer) return;

    this.observer?.disconnect();
    this.player = player;
    this.observer = new MutationObserver(() => this.checkForAd());
    this.observer.observe(player, {
      attributes: true,
      attributeFilter: ['class'],
    });
    // Handle the case where an ad is already showing at attach time.
    this.checkForAd();
  }

  private isAdShowing(): boolean {
    if (!this.player) return false;
    return AD_PLAYING_CLASSES.some((c) => this.player!.classList.contains(c));
  }

  private checkForAd(): void {
    if (!this.isAdShowing()) {
      this.handlingAd = false;
      return;
    }

    const video = this.getVideo();
    if (video) {
      // Jump to the end of the ad. Guard against NaN/Infinity durations that
      // occur momentarily as the ad stream loads.
      if (Number.isFinite(video.duration) && video.duration > 0) {
        try {
          video.currentTime = video.duration;
        } catch {
          /* setting currentTime can throw mid-seek; harmless, retry next tick */
        }
      }
      // The enforcement popup / ad transition sometimes pauses playback.
      if (video.paused) {
        void video.play().catch(() => {});
      }
    }

    this.clickSkipButton();
    this.removeCosmeticAds();

    // Count each ad break exactly once (classes flip several times per ad).
    if (!this.handlingAd) {
      this.handlingAd = true;
      reportAdSkipped();
    }
  }

  private getVideo(): HTMLVideoElement | null {
    const scope: ParentNode = this.player ?? document;
    return scope.querySelector<HTMLVideoElement>(VIDEO_SELECTOR);
  }

  private clickSkipButton(): void {
    for (const sel of SKIP_BUTTON_SELECTORS) {
      const btn = document.querySelector<HTMLElement>(sel);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  }

  private removeCosmeticAds = (): void => {
    for (const sel of AD_CONTAINER_SELECTORS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => el.remove());
    }
  };
}
