# Browser & YouTube Ad Blocker

A Chrome (Manifest V3) extension that blocks advertisements, banners, and tracking networks across all websites, while also fast-forwarding and skipping YouTube video ads.

## How it works

The extension operates with a hybrid two-layer architecture:

### 1. Universal Web Ad Blocking (All Websites)
- **Network Request Blocking:** Uses Chrome's `declarativeNetRequest` engine (`rules/ad-domains.json`) to block major advertising and tracking networks (DoubleClick, Google AdSense, Outbrain, Taboola, Criteo, PopAds, Amazon Ads, etc.) directly at the browser network layer without performance penalties.
- **Cosmetic Hiding:** Injects a lightweight stylesheet (`src/content/generic-cosmetic.css`) across all pages (`<all_urls>`) at `document_start` to collapse empty ad frames, sponsored placeholders, and blank ad boxes.

### 2. Specialized YouTube Video Ad Skipper
YouTube serves video ads inline (often server-side-inserted), meaning network blocking alone is insufficient. The specialized YouTube content script:
1. Watches the player for the `ad-showing` / `ad-interrupting` class.
2. Fast-forwards video ads instantly to the end (`video.currentTime = video.duration`) and clicks "Skip".
3. Removes banner / overlay / companion elements from the YouTube layout.
4. Dismisses YouTube's anti-adblock enforcement dialogs automatically.

## Develop

```bash
npm install
npm run dev     # Vite watch + HMR; rebuilds dist/ on change
```

or a one-off production build:

```bash
npm run build   # type-checks then bundles to dist/
```

## Load in Chrome

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select the **`dist/`** folder
4. Open YouTube — ads are skipped. Click the toolbar icon to toggle on/off and
   see how many ads were blocked.

## Maintenance (important)

YouTube periodically changes its markup to break ad blockers. When ads start
getting through, the fix is almost always in **one file**:

> `src/content/selectors.ts`

All YouTube-specific class names and selectors live there. Add the new
class/selector, run `npm run build`, and reload the extension. No other file
should need to change.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/content/ad-skipper.ts` | Core engine: MutationObserver + skip logic |
| `src/content/selectors.ts` | ★ All YouTube selectors (the update point) |
| `src/content/anti-adblock.ts` | Dismisses the "ad blockers not allowed" popup |
| `src/content/cosmetic.css` | Hides banner/overlay/companion ads |
| `src/background/service-worker.ts` | Ad counter + toolbar badge |
| `src/popup/` | Toggle + counter UI |
| `src/shared/storage.ts` | Typed storage + messaging contract |
| `rules/ad-domains.json` | Secondary domain-blocking rules |
