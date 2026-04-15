# infsh Refinement Notes

`infsh` is now installed and authenticated in this workspace, and the first refinement pass has already been run.

## Current Experimental Theme Assets

Live in the `experimental` highway theme:

- `sparkgame/assets/highway/bg_concert_next.png`
- `sparkgame/assets/highway/bg_recital_next.png`
- `sparkgame/assets/highway/guitar_highway_v3.png`
- `sparkgame/assets/highway/piano_highway_v3.png`
- `sparkgame/assets/vfx/strikeline_screen.png`
- `sparkgame/assets/vfx/hit_spark_screen_v2.png`
- `sparkgame/assets/vfx/combo_flame_generate_v1.png`

Archive/staged but not currently live-wired:

- `sparkgame/assets/highway/guitar_highway_surface_next.png`
- `sparkgame/assets/highway/guitar_highway_surface_refined.png`
- `sparkgame/assets/highway/piano_highway_surface_next.png`
- `sparkgame/assets/highway/piano_highway_surface_refined.png`
- `sparkgame/assets/vfx/hit_spark_next.png`
- `sparkgame/assets/vfx/hit_spark_screen_v2.png`
- `sparkgame/assets/vfx/strikeline_refined.png`
- `sparkgame/assets/vfx/strikeline_next.png`
- `sparkgame/assets/vfx/combo_flame_refined.png`
- `sparkgame/assets/vfx/combo_flame_next.png`

## First Refinement Pass Results

### Strong keepers

- `sparkgame/assets/vfx/strikeline_screen.png`
  - black-backed, screen-blend-friendly strike-line
  - now live in the experimental theme
- `sparkgame/assets/vfx/combo_flame_generate_v1.png`
  - clean black-backed combo accent generated from scratch
  - now live in the experimental theme
- `sparkgame/assets/highway/guitar_highway_v3.png`
  - still the best live runway surface after in-browser comparison
- `sparkgame/assets/highway/piano_highway_v3.png`
  - still the best live piano runway surface after in-browser comparison

### Promising but not yet live

- `sparkgame/assets/vfx/hit_spark_screen_v2.png`
  - much closer to a usable hit effect
  - now wired for lightweight hit-feedback overlays in the experimental theme

### Needs another pass

- `sparkgame/assets/vfx/combo_flame_refined.png`
  - still not clean enough on a black/screen-ready background
  - do not wire live yet
- `sparkgame/assets/highway/guitar_highway_surface_refined.png`
  - okay as reference, but the proven `v3` surface still looks better in-engine
- `sparkgame/assets/highway/piano_highway_surface_next.png`
  - new art direction is good, but the live runway still reads better with the proven `v3` surface

## Suggested Next infsh Work

### 1. Piano Surface Rework

Current source candidate:

- `sparkgame/assets/highway/piano_highway_surface_next.png`

Goal:

- preserve the clean runway
- reduce literal lane-striping a little
- add more premium depth/material contrast
- avoid the washed-out look from the first refinement

Edit prompt:

```text
Refine this piano highway surface overlay for a premium rhythm-game runway. Keep the elegant central perspective and blue-amber palette, but add more material richness and depth while preserving a clean readable center path. Reduce the literal lane-striping slightly without washing out the image. Keep the look luxurious, minimal, and stage-like. No keyboard graphics, no note gems, no hit markers, no text, no logos. Transparent background.
```

### 2. Future Combo Flame Polish

Current live source:

- `sparkgame/assets/vfx/combo_flame_generate_v1.png`

Open improvement:

- generate a less icon-like, more energetic flame while preserving the pure black background

## Models That Worked Well

The first pass was successfully run with:

- `falai/reve@5p7ed7t4`

That model handled local image editing reliably for these asset refinements.
