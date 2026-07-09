/**
 * ★ THE SINGLE SOURCE OF TRUTH for every YouTube-specific string.
 *
 * YouTube changes its markup periodically to break ad blockers. When ads start
 * getting through, this is almost always the ONLY file you need to edit — add
 * the new class name or selector here and rebuild. Keep everything else generic.
 *
 * Last verified against YouTube markup: 2026-07.
 */

/** The main player container. Gets an `ad-showing` / `ad-interrupting` class while an ad plays. */
export const PLAYER_SELECTOR = '#movie_player, .html5-video-player';

/** The actual <video> element inside the player. */
export const VIDEO_SELECTOR = 'video.html5-main-video, video.video-stream, video';

/** Classes YouTube adds to the player element while a video ad is playing. */
export const AD_PLAYING_CLASSES = ['ad-showing', 'ad-interrupting'];

/** "Skip Ad" buttons across YouTube's various player versions. */
export const SKIP_BUTTON_SELECTORS = [
  '.ytp-skip-ad-button',
  '.ytp-ad-skip-button',
  '.ytp-ad-skip-button-modern',
  '.ytp-ad-skip-button-container button',
  'button.ytp-ad-skip-button',
];

/**
 * Cosmetic ad containers to remove from the DOM (feed masthead, in-feed,
 * companion/overlay ads, promoted shelves). Also hidden via cosmetic.css, but
 * removing them here reclaims layout space and stops lazy-loaded ad requests.
 */
export const AD_CONTAINER_SELECTORS = [
  '.ytp-ad-overlay-slot',
  '.ytp-ad-overlay-container',
  '.ytp-ad-image-overlay',
  'ytd-companion-slot-renderer',
  'ytd-action-companion-ad-renderer',
  'ytd-display-ad-renderer',
  'ytd-promoted-video-renderer',
  'ytd-promoted-sparkles-web-renderer',
  'ytd-ad-slot-renderer',
  'ytd-in-feed-ad-layout-renderer',
  'ytd-banner-promo-renderer',
  '#masthead-ad',
  '.ytd-statement-banner-renderer',
];

/**
 * The "Ad blockers are not allowed on YouTube" enforcement popup and its
 * modal/backdrop siblings. Removed by anti-adblock.ts.
 */
export const ENFORCEMENT_SELECTORS = [
  'ytd-enforcement-message-view-model',
  'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)',
  '#dialog.ytd-popup-container',
];

/** Backdrops YouTube uses to freeze the page behind the enforcement popup. */
export const MODAL_BACKDROP_SELECTORS = [
  'tp-yt-iron-overlay-backdrop',
  '#scrim.ytd-popup-container',
];

/** SPA navigation event YouTube fires after routing to a new page. */
export const YT_NAVIGATE_EVENT = 'yt-navigate-finish';
