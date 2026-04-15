# Song Highway Asset Brief

This brief describes the next generation of highway visuals for the live renderer.

The current runtime already supports external archive-backed visuals through:

- `sparkgame/assets/highway/bg_concert.png`
- `sparkgame/assets/highway/guitar_highway_v3.png`
- `sparkgame/assets/highway/bg_recital.png`
- `sparkgame/assets/highway/piano_highway_v3.png`

Use this brief when creating replacement art so the assets drop into the live game without extra engineering work.

## Runtime Targets

The performance highway currently composes two visual layers:

1. Background plate
2. Highway surface overlay

The gameplay canvas sits above both and is transparent.

That means new art should be designed as:

- one full-scene background image per instrument
- one perspective-matched lane/surface overlay per instrument

## Required Files

### Guitar

- `sparkgame/assets/highway/bg_concert_next.png`
- `sparkgame/assets/highway/guitar_highway_surface_next.png`

### Piano

- `sparkgame/assets/highway/bg_recital_next.png`
- `sparkgame/assets/highway/piano_highway_surface_next.png`

## Recommended Specs

### Background Plate

- Format: `PNG`
- Suggested size: `1920 x 1080`
- Color space: `sRGB`
- Transparency: not required

Purpose:

- establish the venue/mood
- add depth behind the lane area
- stay visually calm where notes travel

### Highway Surface Overlay

- Format: `PNG`
- Suggested size: `1920 x 1080`
- Color space: `sRGB`
- Transparency: required

Purpose:

- define the visible runway / lane material
- add glow, bevel, edge treatment, perspective lines, lane tint
- avoid baking note gems, hit markers, or text into the surface

## Safe-Zone Guidance

The center gameplay area must stay readable.

Treat the following as the no-noise zone:

- center `40%` of image width
- lower `55%` of image height

Inside that zone:

- avoid sharp details
- avoid bright textural hotspots
- avoid high-frequency contrast
- avoid readable logos or lettering

Good content for the safe zone:

- smooth gradients
- subtle spotlight falloff
- soft haze
- faint perspective structure

## Visual Direction

### Guitar Background

Mood:

- live stage
- energetic but dark
- cinematic depth

Should include:

- venue atmosphere
- crowd or stage-light suggestion
- depth behind the highway

Should avoid:

- detailed faces
- busy front-row silhouettes
- strong horizontal lines crossing the lane center

### Piano Background

Mood:

- recital hall or intimate stage
- elegant
- cleaner and slightly brighter than guitar

Should include:

- tasteful stage lighting
- premium / refined atmosphere
- depth behind the lane center

Should avoid:

- cluttered room props
- obvious chairs/music stands in the center
- strong texture directly behind falling notes

### Guitar Surface Overlay

Style:

- strong runway feel
- subtle fretboard DNA is okay
- lane edges can glow

Should include:

- clear central path
- mild lane separation
- edge lighting

Should avoid:

- realistic photo fret markers that fight note readability
- busy wood grain in the middle
- hard black lines that overpower notes

### Piano Surface Overlay

Style:

- cleaner, more geometric
- premium stage/runway feel
- less literal keyboard texture

Should include:

- elegant perspective plane
- restrained lane separation
- soft edge glow

Should avoid:

- literal full piano keybed graphics in the center lane
- heavy black/white key contrast under note travel

## Contrast Targets

Aim for:

- dark-to-mid values behind notes
- enough contrast that bright gems and hit FX stand out
- no pure-white hotspots near the hit line

If in doubt:

- make the background darker
- make the surface overlay softer

## Hit-Line Area

The bottom-center region around the strike line should be especially clean.

Reserve the bottom `18%` of the image for:

- minimal texture
- subtle glow only
- no detailed objects

That is where combo flame, hit effects, and note impact are most visible.

## VFX Follow-Up Assets

Not required for the first pass, but good next targets:

- `sparkgame/assets/vfx/hit_spark_next.png`
- `sparkgame/assets/vfx/combo_flame_next.png`
- `sparkgame/assets/vfx/strikeline_next.png`

Recommended:

- `PNG`
- alpha background
- sprite-sheet friendly if possible

## Practical Review Checklist

Before calling an asset ready, test against these questions:

- Can I still read notes clearly in the center?
- Is the hit-line area free of distracting detail?
- Does the highway feel like a runway instead of a poster?
- Does the instrument identity come through without literal clutter?
- Does the background still work when slightly dimmed by overlays?

## Suggested Integration Order

1. Replace Guitar background
2. Replace Piano background
3. Replace Guitar surface overlay
4. Replace Piano surface overlay
5. Review in live performance mode
6. Then update VFX
