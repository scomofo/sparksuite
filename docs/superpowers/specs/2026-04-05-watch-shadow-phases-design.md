# Watch & Shadow Phases — Design Spec

## Problem

Guided session NewMove phases (watch, shadow, try, refine) all render nearly identical static chord diagrams. "Watch" and "Shadow" have no meaningful differentiation from "Try" — there's nothing to actually watch or shadow.

## Solution

- **Watch**: Animated step-by-step finger placement breakdown with narration and per-finger audio
- **Shadow**: Interactive quiz where user taps correct finger positions on an empty fretboard/keyboard

## Watch Phase — Animated Breakdown

### Guitar / Bass / Ukulele

1. Chord diagram starts as an **empty fretboard** (grid + string labels, no finger dots)
2. Fingers land one at a time with ~1s delay between each
3. As each finger lands:
   - Finger dot scales in (CSS `transform: scale(0->1)` over 300ms)
   - Text label appears below diagram: e.g., "Index (1) -> 2nd fret, A string"
   - That string's note plays via existing audio system
4. Barre chords: bar sweeps across first (800ms), then remaining fingers stagger in
5. After all fingers placed, full chord strums once
6. Two buttons: **"Watch Again"** (replays animation) and **"Got It"** (advances to Shadow)

### Piano

1. Piano keyboard diagram starts with all keys in neutral/default state
2. Keys light up one at a time with ~1s delay
3. As each key lights up:
   - Key fills with accent color, finger number label (1-5) appears on the key
   - Text label appears: e.g., "Thumb (1) on C"
   - That note plays
4. After all keys lit, full chord plays
5. Same two buttons: "Watch Again" / "Got It"

### Animation Data

Chord definitions already include finger numbers in their shape arrays. The animation sequence is derived from the existing chord data:

- **Guitar/bass/ukulele**: `chord.frets` + `chord.fingers` arrays provide position and finger identity. Animation order: lowest finger number first (index before middle before ring before pinky). Barre (finger 1 across multiple strings) always animates first.
- **Piano**: chord note arrays already exist in `PIANO_CHORDS`. Animation order: left-to-right (lowest note first). Finger numbers: standard piano fingering (1=thumb through 5=pinky), derived from chord type and hand position.

## Shadow Phase — Interactive Quiz

### Guitar / Bass / Ukulele

1. **Empty fretboard** with tappable fret+string intersections rendered as invisible hit targets
2. Sequential prompts: "Tap where finger 1 (index) goes", "Tap where finger 2 (middle) goes", etc.
   - Prompt order matches the Watch animation order
3. User taps a fret intersection:
   - **Correct**: finger dot appears with a pop animation, string note plays, next prompt shows
   - **Incorrect**: brief shake animation on the tapped spot, no dot placed, try again (no limit)
4. After all fingers correctly placed:
   - Full chord strums
   - Brief celebration (e.g., checkmark + "Nice!" text, subtle pulse on the completed diagram)
   - **"Continue"** button appears to advance to Try phase

### Piano

1. Piano keyboard with tappable keys
2. Single prompt: "Tap the keys for [chord name] in order (low to high)"
3. User taps keys one at a time:
   - **Correct**: key lights up with finger number label, note plays, waits for next tap
   - **Incorrect**: brief shake on the tapped key, try again
4. After all keys correct:
   - Full chord plays, celebration, "Continue" button

### Hit Targets

- **Stringed instruments**: overlay transparent `<rect>` elements on each fret+string intersection in the SVG. Size: ~20x20px centered on the intersection point. Touch-friendly minimum 44x44px on mobile.
- **Piano**: existing key shapes become tappable. Each key is already a distinct SVG/DOM element.

## Instrument Plugin Interface

Each instrument provides Watch/Shadow rendering through the existing plugin system. Two new methods on the instrument config:

```
watchAnimation(container, chordData, options)
  - Renders the animated Watch phase into container
  - options.onComplete callback when animation finishes
  - options.replay() restarts the animation
  - Returns a cleanup function

shadowQuiz(container, chordData, options)
  - Renders the interactive Shadow quiz into container
  - options.onComplete callback when all fingers correctly placed
  - Returns a cleanup function
```

Instruments without these methods fall back to the current static diagram behavior (graceful degradation for drums stub).

## Guided Page Integration

In `js/pages/guided.js`, the `_guidedNewMove()` function's Watch and Shadow cases change from rendering static HTML to:

1. Creating a container div
2. Calling the active instrument's `watchAnimation()` or `shadowQuiz()`
3. Wiring the `onComplete` callback to show the advance button

The Try and Refine phases remain unchanged.

## Files to Create / Modify

### New files
- `js/instruments/guitar/watch.js` — guitar Watch animation + Shadow quiz
- `js/instruments/piano/watch.js` — piano Watch animation + Shadow quiz
- `js/instruments/bass/watch.js` — bass Watch animation + Shadow quiz (reuses stringed instrument logic)
- `js/instruments/ukulele/watch.js` — ukulele Watch animation + Shadow quiz (reuses stringed instrument logic)
- `js/core/watch_common.js` — shared animation utilities (timing, celebration, shake effect) and common stringed-instrument Watch/Shadow logic that guitar/bass/ukulele delegate to

### Modified files
- `index.html` — add `<script>` tags for new files (after instrument register.js files, before app.js)
- `js/pages/guided.js` — Watch and Shadow cases call instrument plugin methods instead of rendering static diagrams
- `js/instruments/guitar/register.js` — add `watchAnimation` and `shadowQuiz` to plugin config
- `js/instruments/piano/register.js` — add `watchAnimation` and `shadowQuiz` to plugin config
- `js/instruments/bass/register.js` — add `watchAnimation` and `shadowQuiz` to plugin config
- `js/instruments/ukulele/register.js` — add `watchAnimation` and `shadowQuiz` to plugin config

### Not modified
- `js/ui.js` — existing `chordSVG()` is reused for rendering; no changes needed
- `js/data.js` — chord data already has finger numbers; no schema changes
- `js/audio.js` — existing `strumChord()` and note playback reused as-is
- `js/app.js` — phase transition logic unchanged (still `guidedAdvancePhase`)

## Chord Data Requirements

### Stringed instruments
Existing chord shapes already contain `frets` (array of fret numbers per string, -1 = muted, 0 = open) and `fingers` (array of finger numbers per string, 0 = not fingered). This is sufficient for both Watch animation ordering and Shadow quiz validation.

If a chord is missing `fingers` data, Watch falls back to current animated diagram, Shadow falls back to static diagram with a "no quiz available" message.

### Piano
`PIANO_CHORDS` contains note arrays. Finger numbering is derived algorithmically:
- 3-note chords: fingers 1, 3, 5
- 4-note chords (7ths): fingers 1, 2, 3, 5
- 5-note chords: fingers 1, 2, 3, 4, 5

This covers standard chord voicings. No manual finger mapping needed.

## Edge Cases

- **Open strings** (guitar/bass/uke): not prompted in Shadow quiz (no finger to place). Shown as pre-placed open circles. Only fretted positions are quizzed.
- **Muted strings**: shown as X marks, pre-placed, not quizzed.
- **Single-note exercises**: Watch shows just one finger landing. Shadow asks for one tap.
- **Chords without finger data**: graceful fallback to current static behavior.
- **Mobile touch**: hit targets minimum 44x44px. Fretboard zooms if needed for dense chord shapes.

## No New Dependencies

All rendering uses existing SVG generators and CSS animations. No external animation libraries, no canvas, no new audio assets.
