# infsh Refinement Notes

`infsh` is now installed and authenticated in this workspace, and the first refinement pass has already been run.

## Current Experimental Theme Assets

Live in the `experimental` highway theme:

- `sparkgame/assets/highway/bg_concert_next.png`
- `sparkgame/assets/highway/bg_recital_next.png`
- `sparkgame/assets/highway/guitar_highway_surface_refined.png`
- `sparkgame/assets/highway/piano_highway_surface_next.png`
- `sparkgame/assets/vfx/strikeline_refined.png`
- `sparkgame/assets/vfx/combo_flame_refined.png`

Archive/staged but not currently live-wired:

- `sparkgame/assets/highway/guitar_highway_surface_next.png`
- `sparkgame/assets/highway/piano_highway_surface_refined.png`
- `sparkgame/assets/vfx/hit_spark_next.png`
- `sparkgame/assets/vfx/strikeline_next.png`
- `sparkgame/assets/vfx/combo_flame_next.png`

## First Refinement Pass Results

### Strong keepers

- `sparkgame/assets/vfx/strikeline_refined.png`
  - much cleaner strike-line shape
  - now live in the experimental theme
- `sparkgame/assets/vfx/combo_flame_refined.png`
  - sharper silhouette, more game-ready
  - now live in the experimental theme
- `sparkgame/assets/highway/guitar_highway_surface_refined.png`
  - slightly stronger perspective/glow
  - now live in the experimental theme

### Keep original for now

- `sparkgame/assets/highway/piano_highway_surface_next.png`
  - the refined version came back too washed out
  - stay on the original until a stronger edit exists

## Suggested Next infsh Work

### 1. Piano Surface Rework

Current live source:

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

### 2. Hit Spark Creation Pass

Current source:

- `sparkgame/assets/vfx/hit_spark_next.png`

Goal:

- create a less blown-out, more readable hit effect
- preserve clean radial impact
- stay visible over bright notes and bright backgrounds

Edit prompt:

```text
Refine this hit spark into a premium rhythm-game impact effect. Keep the blue-white energy burst, but reduce the blown-out center and improve readability at small size. Preserve the radial shard feeling, tighten the silhouette, and keep the glow controlled and crisp. Transparent background, no text, no logo, no extra scene elements.
```

## Models That Worked Well

The first pass was successfully run with:

- `falai/reve@5p7ed7t4`

That model handled local image editing reliably for these asset refinements.
