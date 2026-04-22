# Instrument design assets

This directory holds the per-instrument visual assets used by the Warm Ember
Showroom screens (collection cards, featured-instrument hero, profile / song
detail thumbnails). Drop image files here following the schema below and the
Showroom modules pick them up automatically — no JS changes needed.

## Directory layout

```
resources/instruments/
├── guitar/
│   ├── card.png            ← 320×320 square, transparent background preferred
│   └── hero.jpg            ← 800×500 (16:10), full-bleed background image
├── bass/
│   ├── card.png
│   └── hero.jpg
├── ukulele/
│   ├── card.png
│   └── hero.jpg
├── piano/
│   ├── card.png
│   └── hero.jpg
└── drums/
    ├── card.png
    └── hero.jpg
```

## How they're consumed

Each `js/instruments/<id>/register.js` declares:

```js
SparkInstruments.register({
  id: "chordspark",
  instrument: "guitar",
  iconImage: "resources/instruments/guitar/card.png",
  heroImage: "resources/instruments/guitar/hero.jpg",
  ...
});
```

The Showroom modules (`js/launcher.js` `renderCardThumb` / `renderHero`,
plus the per-screen modules in `js/showroom/spark-showroom.js`) prefer
`iconImage` / `heroImage` when the file exists. **When neither is set or
the file 404s, the Showroom falls back to the inline-SVG silhouette
defined in `js/showroom/spark-showroom-svgs.js`** — so the launcher
never shows a broken-image icon.

## Asset specs

### `card.png` (collection card thumbnail)

- **Size**: 320×320 (square, displayed at ~140px in the 2-up grid)
- **Background**: transparent (the card already has a `--surface-container-low` tint)
- **Subject**: instrument body silhouette/photo, centered, ~75% of viewport
- **Color profile**: sRGB
- **File format**: PNG (transparency) or JPEG (opaque if you prefer a hero shot)

### `hero.jpg` (featured-instrument hero background)

- **Size**: 800×500 (16:10 — matches `aspect-ratio:16/10` on `.showroom-hero`)
- **Background**: dark, low-contrast at the bottom (the hero text overlays the lower third)
- **Color profile**: sRGB
- **File format**: JPEG (smaller payload for hero photography)

The hero image is rendered at 60% opacity with a `linear-gradient(to top, var(--bg), transparent 60%)` overlay for legibility, so dark moody product photography reads best.

## CSP

`index.html` Content-Security-Policy is `img-src 'self' data:` so all images
must be served from the project root. External CDN URLs are blocked. If you
ever need to relax this, do it in `index.html` (search for `Content-Security-Policy`).

## Until you have real photos

The Showroom ships with inline-SVG silhouettes (per-instrument brand-color
glow + minimalist body outline) that look intentional rather than placeholder-y.
They're driven by `js/showroom/spark-showroom-svgs.js` and use the same
per-instrument accent palette as the rest of the design.

Drop a real PNG/JPG into the matching subfolder and it overrides the SVG
fallback automatically — no rebuild, no script tag changes.
