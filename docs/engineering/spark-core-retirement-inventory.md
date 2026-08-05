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
2. **Retire SparkInstrumentAdapter** (5 consumers) onto
   InstrumentManager/adapter registry — the registry already carries
   capabilities (sessionStructure, skillProgress, micCalibration).
3. **Repoint the 9 SparkCore barrel consumers** at `window.sparkCore`
   (v2 constructor root) service accessors, then delete `index.js`.
4. **Relocate contracts.js + progress-orchestrator.js** under
   `js/sparksuite/core/` (rename globals only if cheap; alias otherwise).
5. **Home decision for shared services** (storage/events/achievements/
   content/profile): adopt as-is under `js/sparksuite/services/` — they are
   instrument-agnostic and engine-consumed, so relocation is mechanical.
6. Drop the `js/spark-core/` script tags from `index.html` and delete the
   directory; `test_legacy_spark_core_index_resolution.js` retires with it.

Steps 1–2 are gated on the remaining Phase 7 flow retirements; steps 3–6
are mechanical after that.
