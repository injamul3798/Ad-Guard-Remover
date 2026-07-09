/**
 * Detects and dismisses YouTube's "Ad blockers are not allowed on YouTube"
 * enforcement popup, then restores playback if the page was frozen.
 *
 * YouTube injects an enforcement dialog plus a modal backdrop that stops
 * scrolling and pauses the video. We remove both and un-pause the player.
 */

import {
  ENFORCEMENT_SELECTORS,
  MODAL_BACKDROP_SELECTORS,
  VIDEO_SELECTOR,
} from './selectors';

export class AntiAdblock {
  private observer: MutationObserver | null = null;

  start(): void {
    if (this.observer) return;
    this.observer = new MutationObserver(() => this.dismiss());
    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    this.dismiss();
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  private dismiss(): void {
    let removedSomething = false;

    for (const sel of ENFORCEMENT_SELECTORS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        // Remove the closest dialog wrapper so no empty shell remains.
        const dialog = el.closest('tp-yt-paper-dialog, ytd-popup-container');
        (dialog ?? el).remove();
        removedSomething = true;
      });
    }

    for (const sel of MODAL_BACKDROP_SELECTORS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        el.remove();
        removedSomething = true;
      });
    }

    if (removedSomething) {
      this.restorePage();
    }
  }

  /** Undo the page-freeze YouTube applies behind the enforcement popup. */
  private restorePage(): void {
    // YouTube locks scroll via inline styles on <html>/<body>.
    document.documentElement.style.removeProperty('overflow');
    document.body?.style.removeProperty('overflow');

    const video = document.querySelector<HTMLVideoElement>(VIDEO_SELECTOR);
    if (video && video.paused) {
      void video.play().catch(() => {});
    }
  }
}
