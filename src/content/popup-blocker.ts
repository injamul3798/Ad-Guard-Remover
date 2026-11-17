// Runs in MAIN world at document_start on all pages.
// Blocks popup and redirect ads triggered by click events on streaming/piracy sites.
(function () {
  'use strict';

  // ── Click state tracking ───────────────────────────────────────────────────

  let clickActive = false;
  let clickedAnchorOrigin: string | null = null;

  // mousedown fires before the click event — set the flag early
  document.addEventListener('mousedown', () => {
    clickActive = true;
    clickedAnchorOrigin = null;
  }, true);

  // During capture phase of click, record if the user explicitly clicked a link
  document.addEventListener('click', (e: MouseEvent) => {
    const a = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
    if (a) {
      try { clickedAnchorOrigin = new URL(a.href).origin; } catch { /* ignore malformed */ }
    }
  }, true);

  // Reset state after all click handlers (and any window.open calls) have run
  document.addEventListener('click', () => {
    setTimeout(() => {
      clickActive = false;
      clickedAnchorOrigin = null;
    }, 300);
  }, false);

  // Also reset on mouseup in case click never fires (e.g. drag)
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      clickActive = false;
      clickedAnchorOrigin = null;
    }, 500);
  }, true);

  // ── window.open override ───────────────────────────────────────────────────

  const nativeOpen = window.open.bind(window);

  window.open = function (
    url?: string | URL,
    target?: string,
    features?: string,
  ): WindowProxy | null {
    if (!url) return nativeOpen();

    if (!clickActive) {
      // Not triggered by a click — allow (auto-play popups etc. blocked by browser natively)
      return nativeOpen(url, target, features);
    }

    let destOrigin: string;
    try {
      destOrigin = new URL(String(url), location.href).origin;
    } catch {
      return nativeOpen(url, target, features);
    }

    // Always allow same-origin windows (e.g. site's own player/login)
    if (destOrigin === location.origin) {
      return nativeOpen(url, target, features);
    }

    // Allow if the user explicitly clicked a link pointing to this origin
    if (clickedAnchorOrigin === destOrigin) {
      return nativeOpen(url, target, features);
    }

    // Block: cross-origin popup not from an explicit link click — this is an ad
    return null;
  };

  // ── location.assign / replace override ────────────────────────────────────
  // Catches same-tab ad redirects (e.g. location.assign('https://ad.com')) on click.

  function isClickAdRedirect(url: string): boolean {
    if (!clickActive) return false;
    try {
      const dest = new URL(url, location.href);
      return dest.origin !== location.origin && clickedAnchorOrigin !== dest.origin;
    } catch {
      return false;
    }
  }

  try {
    const nativeAssign = location.assign.bind(location);
    const nativeReplace = location.replace.bind(location);

    location.assign = function (url: string): void {
      if (isClickAdRedirect(url)) return;
      nativeAssign(url);
    };

    location.replace = function (url: string): void {
      if (isClickAdRedirect(url)) return;
      nativeReplace(url);
    };
  } catch {
    // location methods not overridable in this environment
  }

})();
