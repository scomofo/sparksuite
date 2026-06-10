# Changelog

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
