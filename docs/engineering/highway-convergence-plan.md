# Highway Convergence Plan

## Song-highway assessment — final disposition (2026-08-16)

The 2026-08 song-highway assessment produced six recommendations. All are
now dispositioned:

| # | Recommendation | Outcome |
|---|---|---|
| 1 | Fix the frozen rhythm highway (runtime stack never loaded) | ✅ Fixed + wiring/reachability tests (PR #114) |
| 2 | Point `chart_io` at the MIDI corpus for real charts | ✅ 33 charts on real tempo maps / time signatures / full durations (PRs #114) |
| 3 | Converge the two highway implementations | ✅ Phases A–C below (PRs #115–#116) |
| 4 | Join curriculum to songs | ✅ Engine half (`getSongReadiness`, PR #114). Data half (2026-08-12): curriculum v2 sessions/activities now carry `focus_song_id` — a canonical title-slug join into each instrument's song library, validated at generation time and surfaced as `songIds` by the legacy adapter. 25 sessions across the four tracks resolve to real songs; loops, drills, and user-choice days stay `null` by design. Public-domain gap closed (2026-08-12): "Ode to Joy" and "Amazing Grace" added as MIT-licensed original arrangements (`scripts/songs/generate_public_domain_midis.js`) with piano library entries and stamped curriculum ids. Still open — all copyright-blocked, no open-source MIDI can exist for them: guitar "Mad World" (1982); ukulele "You Are My Sunshine" (1940, PD in 2036) and "Three Little Birds" (1977 — a personal-use MIDI exists in the corpus; the ukulele library just lacks an entry, which chords-only content could close without licensing issues). |
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
| Judge | `input_judge.js` (lane-aware nearest) | ✅ Converged (2026-08-12): `maybeScorePendingEvents` collects in-window candidates and delegates target selection to `SparkInputJudge.selectSnapshotTarget` — closest full note-match wins over a fractionally-closer partial match, one event per frame's input. Pinned by `tests/test_performance_judge_convergence.js`. | `input_judge` ✅ |
| Score model | integer + combo multiplier | 0–1 weighted → grade | Needs a product decision — different feels, same engine possible |
| Note model | tick-based `SparkNoteEvent` | seconds-based events | Tick-based domain model, flattened at the renderer boundary (the MIDI chart generator already produces real tempo maps) |

## Risks

- The renderer swap is user-visible; it needs interactive verification, not
  just the console-clean clickthrough smoke. Ship behind the fallback flag.
- `spark-highway.js` is a vendored minified bundle — any renderer gap found
  during the swap cannot be patched in-repo (source lives outside).
