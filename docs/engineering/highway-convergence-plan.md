# Highway Convergence Plan

## Song-highway assessment — final disposition (2026-08-16)

The 2026-08 song-highway assessment produced six recommendations. All are
now dispositioned:

| # | Recommendation | Outcome |
|---|---|---|
| 1 | Fix the frozen rhythm highway (runtime stack never loaded) | ✅ Fixed + wiring/reachability tests (PR #114) |
| 2 | Point `chart_io` at the MIDI corpus for real charts | ✅ 33 charts on real tempo maps / time signatures / full durations (PRs #114) |
| 3 | Converge the two highway implementations | ✅ Phases A–C below (PRs #115–#116) |
| 4 | Join curriculum to songs | ✅ Engine half (`getSongReadiness`, PR #114); routing the 600 `focus_song` prose placeholders at real song ids remains open content authoring |
| 5 | MIDI licensing risk | ✅ Resolved as **personal-use**: the project is not commercial and not for distribution. Recorded via a third-party content exclusion in `LICENSE` and `content/songs/midi/README.md`. If distribution intent ever changes, that README is the gate: remove/replace the MIDI corpus first (the repo is public, so making it private is the cleanest further step, owner's choice). |
| 6 | Housekeeping (orphaned TSX, contract doc, script naming) | ✅ Done (PR #114) |

Remaining engineering follow-up: interactive device verification of the
canvas highway (Rollout below), then delete the DOM fallback branch.

_Status as of 2026-08-16: phases A, B, and C are all landed. Phase C shipped
behind the in-page "Classic View" fallback toggle; interactive verification
of the canvas visuals on a real device remains before deleting the DOM
renderer (see Rollout below)._

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
- **C (done, behind fallback): one renderer.** The rhythm highway renders
  through the PixiJS `SparkHighway` renderer that performance mode uses.
  The DOM-div renderer remains the classic fallback: reduced-motion
  accessibility, a missing renderer bundle, or the in-page "Classic View"
  toggle (`S.rhythmHighwayClassicRenderer`) select it. Canvas mode does
  targeted per-frame DOM writes (stats, feedback, lane buttons) so the
  canvas survives; the action layer consults
  `_sparkRhythmHighwayHandlesFrameRender()` before full renders. Pinned by
  `tests/test_rhythm_highway_canvas.js` (real page + real stack + real
  gameplay engine against a stub renderer).

## Rollout

1. Verify canvas visuals interactively on a real device (gem positions,
   lane colors vs accessibility settings, hit particles).
2. After a release of parity, delete the DOM renderer branch and the
   classic toggle (~90 lines of `rhythm_highway.js`).

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
| Judge | `input_judge.js` (lane-aware nearest) | `session.js maybeScorePendingEvents` | ✅ Done — both route candidate selection through `SparkInputJudge` |
| Score model | integer + combo multiplier | 0–1 weighted → grade | Needs a product decision — different feels, same engine possible |
| Note model | tick-based `SparkNoteEvent` | seconds-based events | ✅ Done — performance charts now carry the same tick+tempoMap shape |

### Judge convergence (2026-08-28)

`SparkInputJudge.resolve()` gained an optional `matchFn(note, inputEvent, preset)`
parameter (defaulting to the existing lane-mask matcher, so rhythm mode's call
site is unaffected). `maybeScorePendingEvents` now builds the set of in-window
candidate events that show snapshot activity, then asks the shared judge to
pick the single closest genuinely-matching one — via a `matchFn` that scores
each candidate through the existing `scorePerformanceEvent` and treats a
non-"miss" grade as a match — instead of independently scoring every matching
in-window event off the same input. That independent-per-event scan was the
performance-mode analog of the lane-stealing bug: with two events
simultaneously in-window and both matching, it credited both off one physical
input in the same frame instead of awarding the frame to the closer one and
letting the other resolve on a later frame. `scorePerformanceEvent`'s own
noteScore/timingScore/grade weighting is unchanged — this converges note
*selection*, not the scoring model (that's the separate "Score model" row
above). Falls back to scoring the first in-window candidate directly if
`SparkInputJudge` isn't loaded. Covered by
`tests/test_performance_scoring_judge.js`.

### Note model convergence (2026-08-28)

Rhythm mode's chart events were always authored as tick + tempoMap
(`chart_io`/`SparkChart`) and only flattened to seconds at the gameplay-engine
boundary. Performance mode's ~33 MIDI-imported charts already went through
that same domain model on import, but the flattening step (
`convertSparkSongChartToPerformanceChart`) discarded the tick data once it
computed seconds. The other 88 hand-authored charts in
`data/performance_charts/*.json` never had a tempo map at all — they're
authored directly in seconds.

Rather than migrate those 88 content files to an authored-tick format (a much
bigger, content-format-changing lift), `js/sparksuite/domain/tempo_map.js`
gained `SparkTempoMap.prototype.secondsToTick` (the inverse of the existing
`tickToSeconds`), and `js/performance/chart.js` gained
`ensurePerformanceChartTickModel(chart)`: called once from
`startPerformance` for every chart regardless of source, it backfills
`tick`/`tickLength` on any event that doesn't already have them, using the
chart's own tempo map if it has one, or a synthesized single-tempo map built
from the chart's declared `bpm` otherwise. `convertSparkSongChartToPerformanceChart`
now also carries the *real* tick/tempoMap through instead of discarding it,
so MIDI-imported charts get their exact tick data rather than a synthesized
approximation. `t`/`dur` (seconds) remain the source of truth for gameplay
timing/scoring throughout — this converges the chart *shape*, not the timing
math. Covered by new tests in `tests/test_performance_core.js`.

## Risks

- The renderer swap is user-visible; it needs interactive verification, not
  just the console-clean clickthrough smoke. Ship behind the fallback flag.
- `spark-highway.js` is a vendored minified bundle — any renderer gap found
  during the swap cannot be patched in-repo (source lives outside).
