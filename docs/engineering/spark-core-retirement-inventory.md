# spark-core Barrel Retirement Inventory

_Audited 2026-08-05. Input to migration-checklist "Consolidate composition
roots". Counts are files outside `js/spark-core/` referencing each global._

`js/spark-core/` is 14 files / ~1,700 lines, all loaded by `index.html`
(script tags 31–44) alongside the v2 core in `js/sparksuite/core/`.

## Key finding: the barrel is two different things

1. **Contract infrastructure that Phase 7 is standardizing on** —
   `runtime/contracts.js` (SparkContracts) and `progress-orchestrator.js`
   (SparkProgressOrchestrator, now the drive-mode single entry point for
   retired flows). These are load-bearing and *gaining* responsibility.
   Retirement for them means **relocating** under `js/sparksuite/`, not
   deleting.
2. **True legacy engines** shadowed by v2 equivalents —
   `session-engine.js` (SparkSession), `psychology-engine.js`
   (SparkPsychology), `progress-engine.js` (SparkProgress),
   `practice-engine.js` (SparkPracticeEngine), `instrument-adapter.js`
   (SparkInstrumentAdapter), plus the `SparkCore` namespace barrel
   (`index.js`). These retire by repointing consumers at the v2 core.

Shared services with no v2 equivalent yet — `storage.js` (SparkStorage),
`events.js` (SparkEvents), `achievements.js` (SparkAchievements),
`content-schema.js` (SparkContent), `content-normalizer.js`
(SparkContentNormalizer), `profile-schema.js` (SparkProfile) — need a home
decision (adopt into `js/sparksuite/` or keep as standalone services).

## Consumer counts (files outside js/spark-core/)

| Global | App consumers | Notes |
|---|---|---|
| SparkCore (barrel) | 9 | Namespace over globals; each use is repointable individually |
| SparkStorage | 9 | Suite profile persistence; used by achievements step in orchestrator |
| SparkContent | 7 (+4 test files) | Content schema/validation; used by performance + songs paths |
| SparkProgressOrchestrator | 5 | Phase 7 drive-mode entry point — keep, relocate later |
| SparkInstrumentAdapter | 5 | Legacy adapter; v2 equivalent is InstrumentManager + adapters |
| SparkSession | 4 | Legacy session engine; still owns the shared progression sequence that drive mode delegates to |
| SparkContracts | 4 | Phase 7 contract factories — keep, relocate later |
| SparkProfile | 2 | launcher.js, showroom |
| SparkEvents | 2 | |
| SparkPsychology | 2 | De-leaked; v2 psychology engine already wraps it |
| SparkProgress | 1 | |
| SparkAchievements | 0 | Internal to orchestrator evaluateAll + tests |
| SparkContentNormalizer | 0 | Internal to barrel + tests |
| SparkPracticeEngine | 0 | Internal to barrel + tests |

## Proposed retirement order

1. ✅ **SparkSession.processResults absorbed into the orchestrator** as
   `SparkProgressOrchestrator.runSessionProgression` (all dual-path flows
   retired first — see migration checklist Phase 7). `processResults` is now
   a thin delegate kept for its 4 legacy callers (guitar/bass guided
   completions, v2 progress_engine legacy branch, spark-core barrel
   completeSession); repointing those callers is part of step 3's barrel
   consumer sweep. SparkSession's remaining live responsibility is
   `buildSession` only.
2. **Retire SparkInstrumentAdapter** — audit correction: this is NOT a
   mechanical sweep. Beyond its 5 direct consumers, the v2 instrument
   adapters (`guitar/bass/piano *_adapter.js`) and the v2 InstrumentManager
   use it as a *fallback shim* bridging the legacy active-instrument system
   (SparkInstruments) into the v2 core. Retiring it requires the v2
   adapters to source curriculum/skill-tree/exercises from their own
   modules unconditionally, and InstrumentManager's active-context
   resolution to stop falling back to it. Treat as a design task.
3. ✅ **Barrel consumers repointed / eliminated.** Audit outcome: the "9
   consumers" were mostly comments and same-name collisions with the v2
   constructor. The only live app consumers were 4 dual-branch sites in
   `guitar/app.js` (`SparkCore.startSession` with a `SparkSession.buildSession`
   fallback carrying identical arguments) — collapsed to the direct
   `buildSession` call, since the barrel's startSession only pre-enriched
   options that buildSession resolves internally anyway. `window.SparkCore`
   now has ZERO live app consumers; it is held only by the `index.html`
   script tag and the pinning tests (`test_spark_core.js`,
   `test_legacy_spark_core_index_resolution.js`, `smoke_test.html`).
   Latent bug fixed en route: `spotify_integration.js` and
   `system_wiring.js` (currently unloaded extension files) extended
   `SparkCore.prototype` where `SparkCore` is the barrel *object* — their
   methods could never reach v2 instances. Both now resolve the real
   constructor (`SparkCoreRuntime`, matching `spotify_playlist_sync.js`).
4. ✅ **contracts.js and progress-orchestrator.js relocated** to
   `js/sparksuite/core/contracts.js` and
   `js/sparksuite/core/progress_orchestrator.js` (globals unchanged:
   SparkContracts, SparkProgressOrchestrator). `js/spark-core/runtime/` is
   gone; `index.html` and all test loaders updated.
5. ✅ **Shared services relocated** to `js/sparksuite/services/` (storage,
   events, achievements, content_schema, content_normalizer, profile_schema,
   plus psychology and progress — stateless policy and per-app-profile
   progression are services, not dying legacy). `SparkInstrumentAdapter`
   moved to `js/sparksuite/bridges/instrument_adapter.js` — it is a
   stateless proxy over the ACTIVE legacy `SparkInstruments` module, i.e. a
   bridge by nature; retiring it now means retiring `SparkInstruments`
   itself (the legacy activation system), which is the one remaining
   long-term design task.
6. ✅ **`js/spark-core/` is deleted.** The namespace barrel (`index.js`,
   zero live consumers) is gone along with its `index.html` script tag and
   `test_legacy_spark_core_index_resolution.js`; `smoke_test.html` checks
   the wrapped globals directly. The two genuinely-legacy engines moved to
   `js/sparksuite/legacy/` (`session_engine.js` — buildSession + the
   processResults delegate; `practice_engine.js` — active-module proxy used
   by tests). All globals unchanged throughout.

## Post-retirement state (2026-08-05)

`js/spark-core/` no longer exists. The single composition root is the v2
constructor (`SparkCoreRuntime` / `window.sparkCore`) in
`js/sparksuite/core/spark_core.js`. What remains of the old barrel, by
architectural role:

- `js/sparksuite/core/` — contracts + progress orchestrator (Phase 7 layer)
- `js/sparksuite/services/` — storage, events, achievements, content schema
  + normalizer, profile schema, psychology, progress
- `js/sparksuite/bridges/instrument_adapter.js` — active-legacy-instrument
  proxy (retires with `SparkInstruments`)
- `js/sparksuite/legacy/` — session_engine (buildSession + delegate),
  practice_engine (test-only)

Remaining long-term work: converge `core.completeSession` with orchestrator
drive mode, and retire the `SparkInstruments` legacy activation system
(which takes the bridge and `js/sparksuite/legacy/` with it).
