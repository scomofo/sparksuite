# Studio Console Polish Design

## Goal

Polish the SparkSuite launcher so it feels like a compact studio console: focused, premium, music-native, and easier to scan.

## Scope

This pass changes only the Showroom launcher surface:

- `js/launcher.js` for launcher home, collection, topbar, stats, and bottom navigation markup.
- `spark-showroom.css` for Showroom launcher visual styling.

It does not change learning engines, instrument modules, session runtime, scoring, curriculum, persistence, or action contracts.

## Direction

The approved direction is **Studio Console**. It retains the current warm dark identity while reducing toy-like glow and making surfaces feel more deliberate: deeper panels, restrained borders, compact type, better hierarchy, and accent color used for actions and status.

## UI Changes

The launcher home keeps its current structure: topbar, featured hero, instrument collection, stats, quick launch, and bottom nav. The polish focuses on visual hierarchy:

- Topbar becomes cleaner app chrome with a status-style XP chip.
- Hero becomes the primary action surface with stronger caption hierarchy and a clear performance CTA.
- Instrument cards become compact module tiles with instrument accent rails/dots and steadier hover states.
- Stats become denser control-room readouts.
- Bottom nav becomes quieter fixed chrome with clearer active state.

## Constraints

- Preserve existing click handlers, keyboard handlers, labels, and `act(...)` routing.
- Keep mobile-first dimensions within the existing `--showroom-max` shell.
- Avoid nested cards and decorative blobs.
- Keep reduced-motion support.

## Verification

Run:

```powershell
npm run lint
```

Then open the app locally and visually check the launcher on a mobile-width shell and normal desktop browser width.
