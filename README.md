# YouTube Ad Remover

A Chrome (Manifest V3) extension that removes ads while watching YouTube, with a
simple on/off toggle and an ads-blocked counter.

## How it works

YouTube serves video ads inline (same domain, increasingly server-side-inserted),
so network-blocking alone can't stop them. The reliable technique — used here — is
a **content script** that:

1. Watches the player for the `ad-showing` / `ad-interrupting` class.
2. Fast-forwards the ad to its end (`video.currentTime = video.duration`) and
   clicks any "Skip" button.
3. Removes banner / overlay / companion ad elements.
4. Dismisses the "Ad blockers are not allowed on YouTube" popup and resumes play.

A small `declarativeNetRequest` ruleset (`rules/ad-domains.json`) blocks known
ad/tracker endpoints as a secondary, best-effort layer.

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
