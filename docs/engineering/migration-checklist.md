# SparkSuite Migration Checklist

Tracks the current convergence state after the `SparkState` / `SparkCore` cutover work.

## Current Checkpoint

- `npm test` is green.
- `tests/test_smart_coach.js` is green.
- Direct `S.*` usage has been removed from `js`.
- The tracked legacy-root shim patterns are also removed from `js`, `docs`, and `tests`:
  - `typeof S`
  - `window.__sparkState`
  - `return S;`
  - `S[path]`
  - `globalThis["S"]`
- App/runtime readers now prefer `SparkState.getRoot()` or normalized `sparkCore` snapshots.

## Session Planning

| Flow | Engine-backed SessionPlan | Status |
|------|---------------------------|--------|
| quickStart | Yes | Core-backed |
| guided | Yes | Core-backed |
| chord | Yes | Core-backed |
| drill | Yes | Core-backed |
| daily practice | Yes | Core-backed |
| performance song | Yes | Core-backed |
| spotify play-along | Yes | Core-backed |

## Runtime Ownership

| Area | Status |
|------|--------|
| play-along runtime state | Service-backed |
| dashboard/home snapshots | Core-backed |
| practice/session/runtime pages | Core-backed fallback readers |
| guitar launch/runtime glue | Core-first |
| bass launch/runtime glue | Core-first |
| piano launch/runtime glue | Core-first |
| ukulele progress/rendering | Core-backed |

## Progress And Curriculum

| Area | Status |
|------|--------|
| completed lesson access | `SparkCore` accessor in place |
| progress snapshots | `SparkCore` legacy snapshot accessors in place |
| curriculum unlock/read paths | Core-backed |
| practice selectors | Core-backed |
| recommendation candidates | Core-backed |
| insights/mastery readers | Core-backed |

## Performance

| Area | Status |
|------|--------|
| performance runtime state | Core-backed |
| performance analytics/recommendations | Core-backed |
| performance progression/badges/helpers | Core-backed |
| editor/performance document workflow | Core-backed |

## State Access Migration

| Goal | Status |
|------|--------|
| remove direct `S.*` from app JS | Complete |
| remove legacy root shims from app JS | Complete |
| move hot-path state reads to `SparkState` facade | Complete |
| preserve isolated test fallback via shared root | Complete |

## Verification

Latest clean checkpoint:

- `node tests/test_core.js`
- `node tests/test_smart_coach.js`
- `node tests/test_launcher.js`
- `node tests/test_piano_runtime_core_migration.js`
- `node tests/test_bass_runtime_core_migration.js`
- `node tests/test_guitar_runtime_core_migration.js`
- `node tests/test_sparksuite_core_migration.js`
- `node tests/test_sparksuite_legacy_bridge_cleanup.js`
- `node tests/test_performance_core.js`
- `npm test`

## Remaining Work

These are the highest-value follow-ups now that raw state coupling is out of the way:

1. Retire semantic dual-path behavior where both legacy and normalized flows still coexist behind bridges.
2. Add automated smoke coverage for app boot and end-to-end flows like play-along, guided, and performance.
3. Audit `SparkCore` / bridge overlap and remove duplicate fallback bookkeeping where outcomes are already normalized.
4. Decide whether to keep legacy snapshot accessors long-term or narrow them to test/support-only APIs.
5. Create a checkpoint commit once the branch owner is ready.
