# Song Highway Image Prompts

This sheet turns the asset brief into concrete generation prompts for the next highway art pass.

Related files:

- [ASSET_BRIEF.md](C:/Users/Scott%20Morley/Dev/sparksuite/sparkgame/ASSET_BRIEF.md)
- [MIGRATION_PLAN.md](C:/Users/Scott%20Morley/Dev/sparksuite/sparkgame/MIGRATION_PLAN.md)

Recommended first-pass models:

- Background plates: `bytedance/seedream-4-5`
- Overlay experiments: `google/gemini-3-pro-image-preview`
- Transparent asset and text-following edits: `falai/reve`

## File Targets

### Guitar

- `sparkgame/assets/highway/bg_concert_next.png`
- `sparkgame/assets/highway/guitar_highway_surface_next.png`

### Piano

- `sparkgame/assets/highway/bg_recital_next.png`
- `sparkgame/assets/highway/piano_highway_surface_next.png`

## Guitar Background

Target file: `bg_concert_next.png`

Prompt:

```text
A cinematic live concert background plate for a rhythm-game highway, dark stage atmosphere, deep blue and amber lighting, subtle crowd energy, volumetric haze, strong sense of depth, premium game-art look, empty readable center lane area, minimal detail in the lower center, no musicians in the foreground, no faces, no text, no logos, no UI, composition designed for falling gameplay notes, center 40 percent kept visually calm, lower 18 percent especially clean, realistic but stylized, dramatic stage lighting, widescreen 16:9
```

Negative prompt:

```text
text, logo, watermark, faces, singer, guitarist close-up, microphone in center, busy crowd silhouettes in foreground, bright hotspot in lower center, sharp detail in center lane, heavy smoke obscuring center, poster composition, typography
```

CLI example:

```bash
infsh app run bytedance/seedream-4-5 --input "{\"prompt\":\"A cinematic live concert background plate for a rhythm-game highway, dark stage atmosphere, deep blue and amber lighting, subtle crowd energy, volumetric haze, strong sense of depth, premium game-art look, empty readable center lane area, minimal detail in the lower center, no musicians in the foreground, no faces, no text, no logos, no UI, composition designed for falling gameplay notes, center 40 percent kept visually calm, lower 18 percent especially clean, realistic but stylized, dramatic stage lighting, widescreen 16:9\"}"
```

## Piano Background

Target file: `bg_recital_next.png`

Prompt:

```text
An elegant recital-hall background plate for a rhythm-game highway, refined stage atmosphere, soft gold and cool blue accent lighting, premium concert setting, tasteful cinematic depth, clean center lane area for falling gameplay notes, lower center kept minimal and readable, no piano keys in the center, no chairs or music stands blocking the middle, no performers in foreground, no text, no logos, high-end game environment art, slightly brighter and cleaner than a rock stage, widescreen 16:9
```

Negative prompt:

```text
text, logo, watermark, cluttered stage props, music stand in center, chairs in center, detailed audience faces, bright white spotlight in lower center, literal piano keyboard across the whole image, poster layout, typography
```

CLI example:

```bash
infsh app run bytedance/seedream-4-5 --input "{\"prompt\":\"An elegant recital-hall background plate for a rhythm-game highway, refined stage atmosphere, soft gold and cool blue accent lighting, premium concert setting, tasteful cinematic depth, clean center lane area for falling gameplay notes, lower center kept minimal and readable, no piano keys in the center, no chairs or music stands blocking the middle, no performers in foreground, no text, no logos, high-end game environment art, slightly brighter and cleaner than a rock stage, widescreen 16:9\"}"
```

## Guitar Surface Overlay

Target file: `guitar_highway_surface_next.png`

Prompt:

```text
A transparent highway surface overlay for a guitar rhythm game, strong central runway perspective, subtle fretboard-inspired design language, glowing lane edges, mild lane separation, premium sci-fi concert aesthetic, dark translucent materials, center path clean and readable, no note gems, no hit markers, no text, no logos, no background scene, only the runway overlay, transparent PNG style asset, widescreen 16:9
```

Negative prompt:

```text
background environment, crowd, stage scene, note gems, buttons, icons, text, logo, literal frets with busy markers, heavy wood grain in center, thick black lane lines, keyboard graphics, white hotspot near hit line
```

CLI example:

```bash
infsh app run google/gemini-3-pro-image-preview --input "{\"prompt\":\"A transparent highway surface overlay for a guitar rhythm game, strong central runway perspective, subtle fretboard-inspired design language, glowing lane edges, mild lane separation, premium sci-fi concert aesthetic, dark translucent materials, center path clean and readable, no note gems, no hit markers, no text, no logos, no background scene, only the runway overlay, transparent PNG style asset, widescreen 16:9\"}"
```

## Piano Surface Overlay

Target file: `piano_highway_surface_next.png`

Prompt:

```text
A transparent highway surface overlay for a piano rhythm game, elegant geometric runway perspective, premium stage aesthetic, restrained lane separation, soft edge glow, dark-to-mid translucent materials, clean center travel path for falling notes, refined and minimal, no literal piano keyboard in the middle, no note gems, no hit markers, no text, no logos, no background scene, transparent PNG style asset, widescreen 16:9
```

Negative prompt:

```text
background environment, theater scene, note gems, UI icons, text, logo, literal black and white piano keys across the center, strong checkerboard contrast, heavy texture in lower center, bright strike-line hotspot
```

CLI example:

```bash
infsh app run google/gemini-3-pro-image-preview --input "{\"prompt\":\"A transparent highway surface overlay for a piano rhythm game, elegant geometric runway perspective, premium stage aesthetic, restrained lane separation, soft edge glow, dark-to-mid translucent materials, clean center travel path for falling notes, refined and minimal, no literal piano keyboard in the middle, no note gems, no hit markers, no text, no logos, no background scene, transparent PNG style asset, widescreen 16:9\"}"
```

## Suggested Generation Pass

1. Generate 4 to 6 Guitar background variants.
2. Generate 4 to 6 Piano background variants.
3. Pick one winner for each instrument.
4. Generate matching surface overlays once the background direction is locked.
5. Review the chosen pair in live performance mode before making VFX.

## Review Checklist

- The center lane stays readable.
- The lower hit-line zone is visually quiet.
- The image feels like a playable runway, not a poster.
- The instrument identity is clear without literal clutter.
- Bright notes and hit effects would still stand out over the image.
