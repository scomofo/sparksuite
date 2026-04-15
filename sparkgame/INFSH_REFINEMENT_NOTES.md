# infsh Refinement Notes

`infsh` is installed and authenticated in this workspace, and the first live asset refinement pass is in use.

## Current Experimental Theme Assets

Live in the `experimental` highway theme:

- `sparkgame/assets/highway/bg_concert_next.png`
- `sparkgame/assets/highway/bg_recital_next.png`
- `sparkgame/assets/highway/guitar_highway_v3.png`
- `sparkgame/assets/highway/piano_highway_surface_paintover_v1.png`
- `sparkgame/assets/vfx/strikeline_screen.png`
- `sparkgame/assets/vfx/hit_spark_screen_v2.png`
- `sparkgame/assets/vfx/combo_flame_generate_v2.png`

Archive or staged but not currently live-wired:

- `sparkgame/assets/highway/guitar_highway_surface_next.png`
- `sparkgame/assets/highway/guitar_highway_surface_refined.png`
- `sparkgame/assets/highway/piano_highway_surface_next.png`
- `sparkgame/assets/highway/piano_highway_surface_refined.png`
- `sparkgame/assets/highway/piano_highway_v3.png`
- `sparkgame/assets/vfx/hit_spark_next.png`
- `sparkgame/assets/vfx/strikeline_refined.png`
- `sparkgame/assets/vfx/strikeline_next.png`
- `sparkgame/assets/vfx/combo_flame_generate_v1.png`
- `sparkgame/assets/vfx/combo_flame_refined.png`
- `sparkgame/assets/vfx/combo_flame_next.png`

## Strong Current Keepers

- `sparkgame/assets/vfx/strikeline_screen.png`
  - black-backed, screen-blend-friendly strike-line
  - live in the experimental theme
- `sparkgame/assets/vfx/combo_flame_generate_v2.png`
  - cleaner black-backed combo accent generated from scratch
  - live in the experimental theme
- `sparkgame/assets/highway/guitar_highway_v3.png`
  - still the best live Guitar runway surface after in-browser comparison
- `sparkgame/assets/highway/piano_highway_surface_paintover_v1.png`
  - first acceptable Piano paintover candidate
  - live in the experimental theme for in-engine readability testing

## Promising but Not Yet Final

- `sparkgame/assets/vfx/hit_spark_screen_v2.png`
  - good enough for the lightweight hit-feedback overlay
  - worth improving later if a cleaner pure-black spark can be produced
- `sparkgame/assets/highway/piano_highway_v3.png`
  - still the safe fallback if the new paintover competes too much with dense notes

## Assets That Still Need Work

- `sparkgame/assets/vfx/combo_flame_refined.png`
  - still not clean enough on a black, screen-ready background
- `sparkgame/assets/highway/guitar_highway_surface_refined.png`
  - okay as reference, but the proven `v3` surface still looks better in-engine
- `sparkgame/assets/highway/piano_highway_surface_next.png`
  - interesting direction, but weaker than the current paintover candidate

## Piano Surface Generation Findings

Edit-based generation is the right seam for Piano because it preserves runway perspective much better than blind text-to-image generation.

What worked:

- `pruna/p-image-edit` held onto the existing `piano_highway_v3.png` structure reliably
- local image upload through `infsh` worked cleanly
- the generated perspective stayed closer to a usable runway than fresh text-to-image attempts

What failed:

- one edit drifted into literal road semantics with dashed center markings
- another edit stayed too road-like even after explicitly asking for a stage runway
- pure black background plus strong "runway" language tends to collapse the image into either dark silhouettes or street graphics
- `google/gemini-2-5-flash-image` showed the same road-marking failure mode

Recommended next pass if AI is used again:

- keep using edit-based workflow against `piano_highway_v3.png`
- explicitly forbid: `road`, `street`, `asphalt`, `dashed center line`, `traffic markings`
- ask for `concert-stage floor panels`, `luxury stage runway`, and `subtle geometric guidance`
- avoid asking for `lane stripes`; ask instead for `soft panel seams` or `faint edge accents`

## Piano Paintover Candidate Notes

Candidate:

- `sparkgame/assets/highway/piano_highway_surface_paintover_v1.png`

Why it made the cut:

- finally stops reading like a road
- keeps strong premium material feel
- preserves good depth and stage atmosphere
- has the right blue-edge-light direction
- reads more like stage geometry than traffic lanes

Watch for during live testing:

- glossy vertical reflections becoming too bright
- side wood or material contrast pulling the eye away from notes
- warm inset accents getting too hot near the hit zone

## Suggested Next Work

### 1. Live Piano Readability Pass

Use the current experimental theme and evaluate:

- dense note readability
- hit-line clarity
- whether the reflections compete with notes

If it fails, revert to:

- `sparkgame/assets/highway/piano_highway_v3.png`

### 2. Future Combo Flame Polish

Current live source:

- `sparkgame/assets/vfx/combo_flame_generate_v2.png`

Open improvement:

- generate a less icon-like, more energetic flame while preserving the pure black background

### 3. Prefer Paintover Over Fresh Piano Generation

For Piano runway surfaces, a manual or assisted paintover of the working base is more promising than fresh generation loops.
