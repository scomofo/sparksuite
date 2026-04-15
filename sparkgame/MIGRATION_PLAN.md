SparkGame Highway Asset Migration Plan

Status
- `sparkgame/` is now a deduplicated visual archive.
- The current live highway renderer is bundled in `js/spark-highway.js`.
- The live renderer does not currently pull textures from `assets/` by path, so these archived files are not runtime-wired yet.

Recommended migration candidates

Tier 1: strongest highway background candidates
- `assets/highway/guitar_highway_v3.png`
  - Best Guitar lane/background candidate in the archive.
  - Modern enough to serve as the first visual comparison baseline.
- `assets/highway/piano_highway_v3.png`
  - Best Piano highway equivalent.
- `assets/highway/bg_concert.png`
  - Strong Guitar / general performance backdrop.
- `assets/highway/bg_recital.png`
  - Strong Piano recital-mode backdrop.

Tier 2: useful support art
- `assets/highway/guitar_fretboard.jpg`
  - Useful as texture/reference for lane-surface treatment.
- `assets/gems/gem_master.jpg`
  - Candidate for note/gem styling reference.
- `assets/gems/bar_master.jpg`
  - Candidate for bar / phrase marker styling reference.
- `assets/vfx/hit_spark_sprite.jpg`
  - Best direct candidate for hit feedback.
- `assets/vfx/combo_flame.jpg`
  - Best direct candidate for combo feedback.
- `assets/vfx/strikeline.jpg`
  - Good strike-line reference or overlay source.

Tier 3: optional only
- `assets/ui/icon_blues.jpg`
- `assets/ui/icon_classical.jpg`
- `assets/ui/icon_folk.jpg`
- `assets/ui/icon_jazz.jpg`
- `assets/ui/icon_metal.jpg`
- `assets/ui/icon_rock.jpg`
  - Keep only if genre-specific menu cards or song packs return.
  - Not needed for the current highway feature itself.

Recommended implementation path
1. Unbundle or replace the baked texture references in `js/spark-highway.js`.
2. Introduce a real runtime asset source for highway skins and VFX.
3. Start with the Tier 1 backgrounds only.
4. Compare readability, note contrast, and hit-line clarity in-browser.
5. Add Tier 2 VFX only after the background/lane treatment is stable.

Suggested first experiment
- Guitar:
  - `guitar_highway_v3.png` as lane surface / primary background
  - `bg_concert.png` as backdrop
- Piano:
  - `piano_highway_v3.png` as lane surface / primary background
  - `bg_recital.png` as backdrop

Why not migrate everything at once
- The live highway path is bundled and opaque right now.
- Bulk migration would mix archive cleanup with runtime rendering changes.
- The highest-value comparison is background readability first, VFX second.
