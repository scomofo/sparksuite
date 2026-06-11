# Changelog

## 2026-06-11 — v1.3.0: The desktop release

The full eight-item roadmap in one release (PRs #75–#81).

### Desktop

- **Multi-pane desktop layout** (new desktop.css layer, ≥1100px): instrument home becomes a two-pane workspace (sticky identity/goal rail + tab content), the showroom hero becomes a banner with a 4-up collection grid, suite screens get real widths. Mobile layouts are bit-identical.
- **Tab sprawl collapsed**: guitar and ukulele show the daily loop only (Practice / Songs / Stats / Guide); the other ten activities live in a Toolbox grid inside Practice — every surface stays routable.

### Verification & engagement

- **MIDI-aware guided verify**: a connected keyboard verifies the Try step directly (held notes scored against the target); mic fallback unchanged. Bass confirmed covered by the shared flow; vocals already objectively scored by Rhythm Highway.
- **Streak rescue**: when yesterday was your last session and today is empty, home shows "your N-day streak is on the line" with a one-tap 2-minute save.
- **Daily-ring cross-link**: the session-complete screen states exactly how many minutes close today's ring, right above Next Session.

### Single-user housekeeping

- **Electron-only**: Tauri and Capacitor removed; code signing deliberately deferred (documented in README — it only matters for other people's downloads).
- **Community feature removed**: server, UI, network code, handlers, CSP entries — community sharing for an audience of one was dead weight. Superseded PR #36 closed.
- **Piano page namespacing finished**: the last 21 colliding globals renamed; loading piano pages can no longer shadow shared renderers.
- **Git history rewritten**: the 53MB of vendored binaries and nested duplicate assets are gone from every ref — clones drop from ~72MB to ~17MB.

## 2026-06-10 — v1.2.0: Engagement, pedagogy, and polish

The quality-ladder batch from the full click-through review, plus all bot-review fixes.

### Features

- **Streak protection**: exactly one missed day consumes a weekly-regenerating streak freeze instead of zeroing the streak (🧊 toast explains it); the missed day is credited as a virtual session so same-day re-checks can't undo it
- **Mic-verified Try step**: guided sessions can verify the new chord by ear — hold a clean match ≥75% for 1.2s for +5 XP and a verified badge; degrades to self-report without a mic; verification resets per chord
- **Practice cue on home**: the onboarding implementation-intention now shows as a ribbon under the featured instrument ("after you finish my morning coffee → one session keeps the streak alive")

### UX

- **One suite nav everywhere**: Home / Learn / Library / Profile / Settings replaces five inconsistent per-screen bottom bars; Insights/Leaderboard/Instruments stay reachable from page content
- **Instrument-aware Rhythm Highway copy**: vocals get singing instructions, piano keys, drums pads — no more "Hold frets 1-5" on a vocal drill; adapters can override via payload.instructions (honored in Loop Window too)

### Fixes

- DrumSpark deferred runtime scripts now execute in insertion order (could previously compose the module before its data) and repaint when the module lands
- Tauri bundle version aligned with the release; packaged smoke derives the installer name instead of hardcoding 1.0.0
- Intention ribbon: explicit flex layout, grammatical fallback, stale "undefined"/"null" sentinels filtered

## 2026-06-10 — v1.1.0: Master/convergence reconciliation

Merged `master` into `feature/convergence`, ending six weeks of divergence (forked 2026-04-28). This brings in everything master had that releases lacked: per-instrument content packs, the action-family dispatcher (replacing the 2,269-line act() monolith), the split render pipeline with deferred instrument loading, the learning-path home, the song library, namespaced piano pages, ~60 additional test files including e2e suites, and the curriculum/content tooling.

Merge-integration fixes (bugs present on master itself, exposed during verification):

- `buildPracticePlan`'s legacy fallback called selector names that never existed (`selectWarmupItem` et al.) — every plan rebuild without the core engine threw; now calls the `*Candidate` selectors
- `js/sparksuite/core/storage.js` script tag restored — without it `createDefaultSparkCore()` threw and the entire engine path was dead in the browser (Node tests load files explicitly, so they stayed green)
- Practice-plan launchers now understand engine-generated items (`toLegacyPracticePlan` collapses everything to type "practice"; route from `meta.exerciseType` / `meta.guidedSession` / `meta.durationSec`) — plan "Go" buttons launch real flows on every instrument
- Two stale master tests updated to current contracts (ukulele curriculum-lesson shape; stats markup)

Verified: 141 test files + e2e + UI business-logic scan green, and master's full browser clickthrough smoke passes (it fails on pristine master). Browser smoke added to CI.

Kept from the convergence side: the release pipeline (GitHub Releases + electron-updater with restart prompt, single-instance lock), the 1400x900 window, persistence fixes, packaged CSS/instrument images, and the engine work (timing core, transport engine).

## 2026-06-09 — v1.0.4: Restore instrument card/hero images in packaged builds

The showroom references `resources/instruments/<id>/card.png` and `hero.jpg` relative to index.html, so the images must live inside the asar. v1.0.3 only shipped them as extraResources outside the asar, which 404'd in packaged builds and fell back to SVG silhouettes. The images are now packaged into the asar (and no longer duplicated into extraResources).

## 2026-06-09 — v1.0.3: Repo/installer reconciliation, real auto-update, CI test gate

First release published through CI. Reconciles the repository with the v1.0.2 installer (which had been built from a never-pushed local tree), then moves the release pipeline onto GitHub Releases.

### Fixes

- `validateBeatGrid` now validates raw input downbeats (the ordering/BPM checks were unreachable after normalization) — via PR #50
- Transport `pause()` no longer emits a spurious `tick` event — via PR #50
- `power_chords_01` chart completed to 16 beats / 2 phrases — via PR #50
- Desktop window restored to 1400x900 (repo still had the 500x850 phone-shaped default)
- Packaged builds no longer omit `spark-showroom.css` and `spark-visual-v2.css`
- Community page URL scheme corrected (`https` → `http` for the local server)

### Auto-update

- `electron-updater` against GitHub Releases: background check at startup, install on quit, manual check via the existing settings flow
- Tag-triggered Windows workflow builds and publishes the NSIS installer + `latest.yml`
- Removed the placeholder updater that pointed at `your-domain.example`

### CI & hygiene

- Full 78-file test suite now gates every push and PR (`tests.yml`)
- Removed the unwired second Electron app under `desktop/`, the unreferenced Caption Sync Engine, vendored binaries, and nested duplicate asset directories (PR #50)
- Community server documented as an optional self-hosted extra and excluded from the installer

## 2026-04-02 — SparkSuite Platform Convergence

A major architecture day: merged the feature/convergence branch, built out the SparkCore engine layer, added BassSpark as a full instrument, introduced capo support for guitar, integrated PixiJS highway rendering, and migrated practice/performance pages toward core-backed session state.

### Core Engine

- Created `SparkSession` engine with `buildSession()` and `processResults()` — centralizes session lifecycle across all instruments
- Created `SparkPsychology` engine with reward scheduling and adaptive difficulty heuristics
- Created `SparkInstrumentAdapter` bridge between the launcher registry and core engine
- Created `SparkProgressOrchestrator` unified progression cascade (XP, badges, unlocks, streaks) and hooked it into `SparkSession.processResults()`
- Routed reward timing through `SparkPsychology.shouldReward()`, removed legacy `shouldFireReward`
- Exposed `InstrumentModule` interface methods (getCurriculumMap, getRhythmAdapter, getSongs) via `SparkInstrumentAdapter` for guitar, piano, and bass
- Registered new engines in SparkCore barrel with correct script load order

### BassSpark (New Instrument)

- Created full BassSpark data module: curriculum, notes, sessions, songs, skill tree
- Created bass fretboard SVG renderer (4 strings)
- Created bass `act()` handler with session/drill/guided actions
- Created BassSpark registration with full `InstrumentModule` interface
- Added script tags to `index.html`

### Guitar — Capo Module

- Created capo module: transposition helpers, skills, lessons, exercise generators
- Wired capo data and skill tree into guitar registration
- Added 3 capo-focused guided sessions to `GUITAR_SESSIONS`
- Added `capo.js` script tag to `index.html`

### Guitar — Session Routing

- Routed `quickStart` through `SparkSession.buildSession()`
- Routed session completion through `SparkSession.processResults()`
- Routed drill/chord/resume sessions through `SparkSession`

### Unified Tab System

- Instruments now define their own tabs and renderers — tab navigation is data-driven from instrument registration config

### PixiJS Highway Renderer

- Integrated PixiJS highway renderer (Phase 1 — visual parity with canvas)
- Updated build with sprite assets and bloom effects
- Added AI-generated sprite assets for gems, highway, and VFX

### Platform Convergence Merge

- Merged `feature/convergence` branch: SparkSuite platform architecture unification

### PianoSpark Integration

- MIDI backing track support
- Exported all piano `data.js` IIFE variables to `window` for page access
- Multiple PianoSpark integration fixes

### SparkSuite Core Migration

- Implemented SparkSuite core migration and ukulele module
- Advanced convergence and runtime state across all instruments
- Moved practice pages toward core-backed session state
- Advanced session runtime convergence (session plans, guided state, performance state all routed through SparkCore)

### Performance Calibration & Screen Transitions

- Added explicit SparkCore runtime actions for performance stats, editor, and calibration screen transitions
- Added dedicated `performStatsBack` and `performCalibrationBack` actions instead of falling through generic back handler
- Calibration page now reads source/mode from SparkCore runtime state with fallback to legacy state

### Bug Fixes

- Fixed tautological ternary in `completeSession` that silently dropped `performanceSummary` data
- Fixed plan-reuse branch of `startSession` not resetting `performanceCalibrationMode`
- Fixed `performCalibrationReset` and `performCalibrationStart` reading source from stale legacy state instead of SparkCore
- Fixed `calibration_source` action using `||` fallback instead of `hasOwnProperty` guard
- Differentiated `calibration_reset` from `calibration_stop` by preserving calibration source
- Fixed string tab IDs in SparkSuite `act()` for dashboard tab navigation (3 iterations: map to numeric, then keep as-is)
- Resolved code review issues: CURRICULUM migration + guidedComplete routing

### Tests

- Added test coverage for calibration screen transitions (open_stats, open_editor, open_calibration, calibration_source, calibration_start/stop/reset)
- Added test for cross-action `performanceCalibrationMode` reset (start action clears calibration mode)
- Added transport status assertions for all navigation actions
