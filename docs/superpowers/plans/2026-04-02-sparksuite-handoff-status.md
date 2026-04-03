# SparkSuite Handoff Status

Updated: 2026-04-02

## Scope

This document tracks implementation status for the SparkSuite core migration, rhythm-highway handoff, performance/runtime convergence, and the follow-on cleanup work completed in this repo.

Primary source plans:
- `docs/superpowers/plans/2026-04-02-core-engine-skeleton.md`
- `docs/superpowers/plans/2026-04-01-sparksuite-convergence.md`
- `docs/superpowers/plans/2026-03-31-rocksmith-performance-mode.md`
- `docs/superpowers/plans/2026-04-02-progression-system.md`
- `docs/superpowers/plans/2026-04-02-phase-1-handoff-backlog.md`
- `docs/superpowers/plans/2026-04-02-phase-2-convergence-backlog.md`
- `docs/superpowers/plans/2026-04-02-phase-3-platform-backlog.md`
- SparkSuite ukulele module handoff and fretted-strings tree follow-up
- Download handoffs for SparkSuite rhythm gameplay and related curriculum extensions

## Completed

- Daily-practice flow now routes through SparkSuite core.
  - `js/sparksuite/core/spark_core.js`
  - `js/sparksuite/core/session_engine.js`
  - `js/sparksuite/core/practice_engine.js`
  - `js/sparksuite/core/progress_engine.js`
  - `js/sparksuite/bridges/progress_bridge.js`
- Guided-session and performance-song session entry now route through SparkCore.
  - `js/sparksuite/core/session_engine.js`
  - `js/sparksuite/core/instrument_manager.js`
  - `js/app.js`
  - `js/instruments/guitar/app.js`
  - `js/instruments/bass/app.js`
- Performance-song completion rewards now also flow back through SparkCore instead of being owned entirely by local performance runtime code.
  - `js/sparksuite/core/progress_engine.js`
  - `js/performance/session.js`
  - `tests/test_sparksuite_core_migration.js`
- Performance run stat/progression persistence is now centralized through a SparkSuite bridge instead of being hand-mutated inline in the session orchestrator.
  - `js/sparksuite/bridges/performance_bridge.js`
  - `js/performance/session.js`
  - `tests/test_performance_core.js`
- Performance daily challenge resolution, legacy performance badge awarding, and standalone performance badge/unlock follow-ons are now also routed through the performance bridge.
  - `js/sparksuite/bridges/performance_bridge.js`
  - `js/performance/session.js`
  - `tests/test_performance_core.js`
- Performance runtime flag/screen transitions are now also centralized through the performance bridge, even though the live transport/game loop still lives in the performance session runtime.
  - `js/sparksuite/bridges/performance_bridge.js`
  - `js/performance/session.js`
  - `tests/test_performance_core.js`
- Piano guided-session and performance-song entry now also defer to SparkCore while preserving piano-specific session aliases for the existing UI.
  - `js/instruments/piano/app.js`
  - `tests/test_piano_runtime_core_migration.js`
- Piano is now registered as a first-class SparkSuite instrument adapter in the default core runtime.
  - `js/sparksuite/instruments/piano/piano_adapter.js`
  - `js/sparksuite/instruments/piano/index.js`
  - `js/sparksuite/core/spark_core.js`
  - `tests/test_sparksuite_core_migration.js`
- Bass is now registered as a first-class SparkSuite instrument adapter in the default core runtime.
  - `js/sparksuite/instruments/bass/bass_adapter.js`
  - `js/sparksuite/instruments/bass/index.js`
  - `js/sparksuite/core/spark_core.js`
  - `tests/test_sparksuite_core_migration.js`
- First engine-owned rhythm-highway slice is implemented.
  - `js/sparksuite/core/rhythm_gameplay_engine.js`
  - `js/sparksuite/core/timing_engine.js`
  - `js/sparksuite/core/input_judge.js`
  - `js/sparksuite/core/scoring_engine.js`
  - `js/sparksuite/core/replay_engine.js`
  - `js/sparksuite/core/calibration_engine.js`
  - `js/pages/rhythm_highway.js`
- Chart import parity moved beyond the first `.chart` slice.
  - `SparkChartIO.fromNotesChart(...)` supports `notes.chart` + `song.ini`
  - `SparkChartIO.fromMidiBuffer(...)` supports `.mid` import with tempo changes, time signatures, track selection, marker phrases, and channel filtering
  - `SparkChartIO.fromPackage(...)` supports package-style ingestion of `notes.chart`/`notes.mid` + `song.ini`
  - `js/sparksuite/core/chart_io.js`
- Performance mode can ingest package-backed imported charts through the normal chart loader.
  - `js/performance/chart.js`
  - `data/performance_charts/demo_imported_package.json`
  - `js/pages/songs.js`
- Performance chart discovery now uses a manifest-backed registry instead of a tiny inline list.
  - `js/performance/chart_manifest.js`
  - `js/performance/chart.js`
  - `index.html`
- Imported chart semantics now survive conversion into performance-mode events.
  - Preserved fields include `laneMask`, `sourceFlags`, `sourceLabel`, and `sourceSkillId`
  - Imported `open` and `tap` events keep distinct event types
  - `js/performance/chart.js`
- Imported chart semantics now affect performance scoring.
  - Open notes score from attack timing activity
  - Tap notes require a real attack cluster
  - `js/performance/scoring.js`
  - `js/performance/session.js`
- Imported chart semantics now affect performance rendering.
  - Technique preview badges above the highway
  - Technique-specific hit-burst colors
  - Time-positioned technique overlay tokens inside the highway region
  - `js/performance/highway.js`
  - `js/pages/perform.js`
- Legacy XP/toast/progression cleanup substantially centralized through bridge helpers.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/practice/progress.js`
  - `js/practice/weakspots.js`
  - `js/practice/adaptive.js`
  - `js/performance/practice_engine.js`
  - `js/practice/plan.js`
  - `js/spark-core/session-engine.js`
  - `js/app.js`
  - `js/performance/session.js`
- Shared legacy drill/daily/rhythm/runner/ear-training/song completion bookkeeping is now also centralized through the progress bridge instead of being hand-mutated inline in `js/app.js`.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
  - `tests/test_sparksuite_legacy_bridge_cleanup.js`
- Shared mini-activity runtime state for ear training and song playback now also routes through the progress bridge for start/stop/reset-style state transitions instead of direct inline field/timer mutation.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
  - `tests/test_sparksuite_legacy_bridge_cleanup.js`
- Shared mini-game runtime state for rhythm and runner now also routes through the same bridge helper for start/finish flags and animation-frame cleanup, leaving the live loops local but reducing direct state ownership in `js/app.js`.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
  - `tests/test_sparksuite_legacy_bridge_cleanup.js`
- Legacy tab resets, strum-mode runtime state, and the session-complete handoff in `js/app.js` now also route their state transitions through the shared runtime helper instead of directly mutating those fields inline.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
- `stopAllTimers()` and the main legacy screen-open/back actions in `js/app.js` now route their broad reset/screen transitions through the shared runtime helper too, reducing one of the last large pockets of inline shell-owned state.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
- Tuner runtime flags, dark-mode toggling, and onboarding completion in `js/app.js` now also route their simple state transitions through the shared runtime helper instead of direct field mutation.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
- Metronome and chord-detect state flips in `js/audio.js` now also route their simple runtime/error state through the shared runtime helper, which pushes another tool boundary away from direct `S.*` mutation.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/audio.js`
- Audio-input testing and MIDI device/output state in `js/audio.js` now also route their simple setup/selection state through the shared runtime helper, leaving the live signal polling local but reducing more direct shell-owned device state.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/audio.js`
- Stem playback state in `js/audio.js` now also routes simple play/pause/current-time/duration/reset flags through the shared runtime helper, leaving the actual `Audio` objects local while trimming more direct media-state ownership.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/audio.js`
- Performance/editor screen-open and selection state in `js/app.js` now also routes more simple performance-song, editor, stats, skill-tree, calibration, and stop-return transitions through the shared runtime helper instead of direct inline screen mutation.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
- Stem-separation UI state and song-audio import status in `js/app.js` now also route their simple status/progress/screen transitions through the shared runtime helper, leaving the Electron file-processing flow local while reducing more shell-owned UI state.
  - `js/sparksuite/bridges/progress_bridge.js`
  - `js/app.js`
- Ukulele now exists as a module-backed instrument instead of a core-engine fork.
  - New SparkSuite content and adapter files under `js/sparksuite/instruments/ukulele/`
  - Launcher/onboarding registration in `js/instruments/ukulele/register.js`, `js/onboarding/ui.js`, and `js/onboarding/actions.js`
  - Default SparkCore registration in `js/sparksuite/core/spark_core.js`
- Ukulele now has a small authored rhythm chart library and multiple performance chart entries in the shared manifest-backed registry.
  - `js/sparksuite/instruments/ukulele/ukulele_module.js`
  - `data/performance_charts/ukulele_island_package.json`
  - `data/performance_charts/ukulele_switch_flow_package.json`
  - `js/performance/chart_manifest.js`
  - `js/instruments/ukulele/register.js`
- Legacy practice selectors now understand the current flat performance stats shape and module-driven instrument candidates.
  - `js/practice/selectors.js`
  - `tests/test_practice_selectors.js`
- More legacy practice wrappers now defer to the shared practice engine path instead of duplicating plan ownership.
  - `js/practice/plan.js`
  - `js/performance/practice_engine.js`
  - `js/practice/engine.js`
  - `tests/test_sparksuite_legacy_bridge_cleanup.js`
- Phase 2 convergence has started with an engine-owned SparkCore runtime state model instead of only legacy-state projection.
  - `js/sparksuite/core/spark_core.js`
  - `tests/test_sparksuite_core_migration.js`
- The shared practice plan screen can now prefer a core-backed active session view instead of reading only legacy practice-plan state.
  - `js/sparksuite/core/spark_core.js`
  - `js/pages/plan.js`
  - `tests/test_sparksuite_core_migration.js`

## Partial

- SparkSuite core owns major entry and completion flows, but not every runtime path in the app is fully migrated.
- SparkCore now exposes an explicit runtime-state API, and the plan screen has started consuming it, but pages and live loops still mostly read from legacy shell state first.
- SparkSuite core now owns more of the piano runtime too, but broader piano gameplay/runtime and other legacy instrument flows still have local orchestration paths.
- Performance session orchestration is much thinner now, but the live transport/game loop still lives outside SparkCore.
- Rhythm-highway architecture exists and is playable, but later-phase gameplay features are still partial.
  - Assist-mode depth
  - richer loop tooling
  - broader instrument-specific rhythm libraries
- Performance imported-chart support is integrated, but the shared `SparkHighway` renderer itself has not been deeply modified.
  - Current parity is achieved with conversion, scoring, preview, hit-color, and overlay layers
  - The underlying note sprite renderer still treats imported techniques generically
- Progression cleanup is significantly better, but the app still persists to legacy `S.*` state.
- Ukulele launcher support is live, but deeper performance/song-library parity is still early.
  - Current implementation now covers launcher, onboarding, module-aware practice suggestions, a small authored rhythm library, two manifest-backed performance charts, and a first 4-lane rhythm payload path
  - Broader dedicated song/chart coverage, richer module-specific screens, and deeper gameplay parity can still expand

## Remaining

- Migrate more non-SparkSuite runtime paths fully under SparkCore ownership.
- Replace more legacy `S.*` persistence with engine-owned progress/profile objects.
- Push imported technique semantics deeper into the shared `SparkHighway` renderer.
- Extend rhythm-highway parity for more instruments and richer authored content.
- Expand ukulele authored content beyond the current first rhythm-library and two-chart performance slice.
- Extend imported-chart technique details further into analytics and recommendation surfaces beyond the current first-pass summaries.

## Verification

Regression coverage currently includes:
- `tests/test_sparksuite_core_migration.js`
- `tests/test_sparksuite_rhythm_core.js`
- `tests/test_sparksuite_legacy_bridge_cleanup.js`
- `tests/test_piano_runtime_core_migration.js`
- `tests/test_performance_core.js`

Current validation command:

```bash
npm test
```

## Recommended Next Order

1. Move more runtime ownership from legacy app state into SparkCore and engine-owned domain objects.
2. Deepen instrument parity, especially broader ukulele song/performance libraries and richer rhythm authoring.
3. Push imported technique semantics deeper into the shared renderer and analytics surfaces.
