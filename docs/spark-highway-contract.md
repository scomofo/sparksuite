# SparkHighway Renderer Contract

## Overview
SparkHighway is a shared PixiJS (WebGL/WebGPU) note highway renderer used by both ChordSpark and
PianoSpark. It ships as a vendored minified bundle at `js/spark-highway.js`; the source is
maintained outside this repo.

## API

### Constructor
`new SparkHighway(canvasElement, skinConfig)`

### Methods
- `setChart(events, phrases)` — Load chart data for rendering. Events carry
  `{t, dur, type, chord, notes, laneLabel, lane, laneMask, strum}` plus scoring flags
  (`_scored`, `_hit`, `_miss`, `_result`, `_score`) written by the caller; `lane`/`laneMask`
  drive positioning.
- `update(currentTimeSec, combo)` — Render one frame at the given time
- `notifyHit(x, y, color)` — Trigger particle burst at position
- `destroy()` — Clean up resources

### Skin Configs
- `SparkHighway.GUITAR_SKIN` — 6 lanes, circular gems, button indicators
- `SparkHighway.PIANO_SKIN` — 24 lanes, rectangular notes, key indicators

## What SparkHighway Owns
- Lane geometry and perspective projection
- Note/gem drawing with approach animation
- Strike line rendering
- Lane indicator rendering (guitar buttons / piano keys)
- Fret bar timing markers
- Combo flame visual effect
- Particle burst effects

## What SparkHighway Does NOT Own
- Scoring logic
- Profile/progress persistence
- Audio playback or transport timing
- Chart loading or validation
- Input handling (MIDI/mic)

## Chart Event Shape
Events passed to `setChart()`:
```js
{ t, dur, type, chord, notes, laneLabel, strum, _scored, _hit, _miss, _result, _score }
```

## Integration
Apps should use `PerfHighwayAdapter` (js/performance-core/spark-highway-adapter.js) rather than calling SparkHighway directly.
