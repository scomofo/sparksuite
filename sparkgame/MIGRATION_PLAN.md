# SparkGame Highway Asset Migration Plan

## Current Status

`sparkgame/` is now a deduplicated visual archive, and the highest-value Tier 1 highway assets are already wired into the live runtime.

Implemented:

- the live performance highway reads external background and surface assets by path
- theme selection is data-driven through:
  - [C:\Users\Scott Morley\Dev\sparksuite\js\performance\highway.js](C:/Users/Scott%20Morley/Dev/sparksuite/js/performance/highway.js)
  - [C:\Users\Scott Morley\Dev\sparksuite\js\performance\highway_themes.js](C:/Users/Scott%20Morley/Dev/sparksuite/js/performance/highway_themes.js)
- the perform page supports in-app theme switching and per-instrument theme persistence
- an `experimental` theme is now wired for side-by-side testing with next-pass art
- the live runtime now supports lightweight theme-driven VFX overlays for:
  - strike-line treatment
  - combo flame accent
- the runtime currently uses these archive-backed visuals:
  - Guitar:
    - `sparkgame/assets/highway/bg_concert.png`
    - `sparkgame/assets/highway/guitar_highway_v3.png`
  - Piano:
    - `sparkgame/assets/highway/bg_recital.png`
    - `sparkgame/assets/highway/piano_highway_v3.png`

Partially implemented:

- Tier 2 VFX migration has started through the `experimental` theme:
  - `sparkgame/assets/vfx/strikeline_refined.png`
  - `sparkgame/assets/vfx/combo_flame_refined.png`

Not yet implemented:

- hit-spark migration is still pending
- the bundled `js/spark-highway.js` has not been fully unbundled or replaced
- there is not yet a generalized asset pipeline for all note/gem/impact textures, only the background and surface seam

## Recommended Migration Candidates

### Tier 1: live and proven

- `assets/highway/guitar_highway_v3.png`
  - active Guitar surface candidate
- `assets/highway/piano_highway_v3.png`
  - active Piano surface candidate
- `assets/highway/bg_concert.png`
  - active Guitar / performance backdrop
- `assets/highway/bg_recital.png`
  - active Piano backdrop

### Tier 2: next useful runtime candidates

- `assets/vfx/hit_spark_sprite.jpg`
  - best candidate for hit feedback migration
- `assets/vfx/combo_flame.jpg`
  - best candidate for combo feedback migration
- `assets/vfx/strikeline.jpg`
  - strongest strike-line treatment candidate
- `assets/gems/gem_master.jpg`
  - useful note/gem styling reference
- `assets/gems/bar_master.jpg`
  - useful phrase/bar marker styling reference
- `assets/highway/guitar_fretboard.jpg`
  - useful as source/reference only, not recommended as direct live background art

### Tier 3: optional only

- `assets/ui/icon_blues.jpg`
- `assets/ui/icon_classical.jpg`
- `assets/ui/icon_folk.jpg`
- `assets/ui/icon_jazz.jpg`
- `assets/ui/icon_metal.jpg`
- `assets/ui/icon_rock.jpg`

These are only useful if genre-based menu cards or song-pack presentation returns. They are not needed for the current highway migration path.

## Runtime Shape Today

The live performance highway currently composes:

1. background plate
2. highway surface overlay
3. gameplay canvas above both

That means the current seam is already ready for:

- replacement Guitar background plates
- replacement Piano background plates
- replacement Guitar runway overlays
- replacement Piano runway overlays

without more renderer surgery.

## Theme System Status

The runtime already supports:

- manifest-driven asset definitions
- named themes
- per-chart theme selection
- global persisted theme selection by instrument
- in-app switching on the performance screen

Current built-in themes:

- `classic`
- `legacy`
- `experimental`

## Recommended Next Work

### 1. Replace Tier 1 art with new purpose-built assets

Use the handoff docs:

- [C:\Users\Scott Morley\Dev\sparksuite\sparkgame\ASSET_BRIEF.md](C:/Users/Scott%20Morley/Dev/sparksuite/sparkgame/ASSET_BRIEF.md)
- [C:\Users\Scott Morley\Dev\sparksuite\sparkgame\IMAGE_PROMPTS.md](C:/Users/Scott%20Morley/Dev/sparksuite/sparkgame/IMAGE_PROMPTS.md)

Target files:

- `sparkgame/assets/highway/bg_concert_next.png`
- `sparkgame/assets/highway/guitar_highway_surface_next.png`
- `sparkgame/assets/highway/bg_recital_next.png`
- `sparkgame/assets/highway/piano_highway_surface_next.png`

### 2. Finish VFX migration after the backgrounds are stable

The experimental theme now already uses:

- `sparkgame/assets/vfx/strikeline_refined.png`
- `sparkgame/assets/vfx/combo_flame_refined.png`

Still open:

- evaluate `hit_spark_sprite.jpg`
- decide whether the refined combo/strike assets should graduate into `classic`
- tune overlay placement and opacity from live play feedback

## Why The Order Changed

The original plan assumed the runtime could not yet consume archive assets directly.

That is no longer true.

The highest-value migration step has already happened, so the remaining work is now:

- art replacement
- theme expansion
- VFX follow-up

instead of foundational runtime plumbing.
