# Highway Convergence Plan

_Status as of 2026-08-16. Phases A and B landed; this doc scopes phase C._

The song-highway assessment found two complete, non-overlapping highway
implementations. Convergence phases:

- **A (done): one hit-window source.** `SparkEnginePresetRegistry` owns every
  window; `performance/difficulties.js` derives from named presets
  (easy→spark_gentle, normal→spark_learning, pro→spark_pro). The third,
  never-loaded timing system (`js/sparksuite/runtime/`, `js/sparksuite/gameplay/`)
  is deleted. Pinned by `tests/test_timing_convergence.js`.
- **B (done): one latency model.** `SparkTimingCore.fromPerformanceState`
  resolves global + per-input-mode offsets for both performance mode and the
  rhythm gameplay clock. The apparent sign-convention conflict was three
  application points with one consistent effect (documented at the model).
- **C (planned): one renderer.** Retire the DOM-div highway in
  `js/pages/rhythm_highway.js` onto the PixiJS `SparkHighway` renderer that
  performance mode already uses.

## Phase C sketch

Reuse performance mode's integration pattern (`js/performance/highway.js`:
`ensureSparkHighway` / `feedChartToHighway` / `updateSparkHighway`):

1. The rhythm page's highway region renders a persistent canvas container;
   `ensure...` re-attaches the canvas across full-page re-renders (the app
   re-renders HTML wholesale, so the canvas must survive `render()` — exactly
   what performance mode's ensure step handles).
2. Map the gameplay engine's snapshot notes (already in seconds, with lanes)
   to `SparkHighway.setChart` events `{t, dur, lane, laneLabel}`; pick the
   skin from the instrument adapter's lane count.
3. Drive `SparkHighway.update(positionSec, combo)` from the runtime
   controller's `onRender` (transport is already the clock source after the
   wiring fix); call `notifyHit` from the judgement path.
4. Keep the DOM implementation behind a fallback flag for one release, then
   delete (~350 lines of `rhythm_highway.js` rendering plus its bespoke
   66px/sec geometry).

## Remaining duplication after C

| Concern | Rhythm | Performance | Convergence target |
|---|---|---|---|
| Judge | `input_judge.js` (lane-aware nearest) | `session.js maybeScorePendingEvents` | `input_judge` (it fixed a lane-stealing bug the performance scanner still has) |
| Score model | integer + combo multiplier | 0–1 weighted → grade | Needs a product decision — different feels, same engine possible |
| Note model | tick-based `SparkNoteEvent` | seconds-based events | Tick-based domain model, flattened at the renderer boundary (the MIDI chart generator already produces real tempo maps) |

## Risks

- The renderer swap is user-visible; it needs interactive verification, not
  just the console-clean clickthrough smoke. Ship behind the fallback flag.
- `spark-highway.js` is a vendored minified bundle — any renderer gap found
  during the swap cannot be patched in-repo (source lives outside).
