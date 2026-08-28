# SparkSuite Phase 2 Backlog

Updated: 2026-04-02

## Purpose

This document defines `Phase 2` for SparkSuite: architectural convergence away from the legacy app shell.

Phase 2 begins after Phase 1 is credible enough that the remaining gaps are mostly about who owns runtime state and orchestration, not whether the product features exist.

## Phase 2 Definition

Phase 2 is complete when:

- SparkSuite core/runtime objects are the real source of truth for active session and runtime state.
- The legacy `S.*` state shape is mostly a compatibility projection, not the authoritative owner.
- Pages and runtime loops consume engine-owned state first.
- Bridges are thin synchronization adapters rather than shadow logic owners.

Phase 2 does **not** require:

- deleting every legacy file
- finishing every long-tail content expansion
- perfect product polish across every instrument

## Primary Goals

### 1. Introduce Engine-Owned Runtime State

Goal:
- make `SparkCore` own an explicit runtime/session/UI state model

Required work:
- define a runtime state shape for current screen, active instrument, active plan, active segment, and transport-related state
- add patch/update helpers on `SparkCore`
- stop treating legacy `S.*` as the only readable state store

Acceptance criteria:
- `SparkCore` exposes a stable runtime state API
- runtime state can be updated without directly mutating legacy global state first

### 2. Move Pages Toward Core-State Rendering

Goal:
- make pages read more from core/domain state and less from legacy shell globals

Required work:
- identify page surfaces that can read plan/session/runtime state directly from `sparkCore`
- add compatibility selectors where needed
- reduce page-local assumptions about `S.*` ownership

Acceptance criteria:
- at least the major SparkSuite-driven screens can render from core-backed state accessors

### 3. Move Live Runtime Loops Toward Engine Ownership

Goal:
- stop letting page/app files own the important runtime state machines

Required work:
- identify the remaining session/game/runtime loops still living in `app.js` and other legacy files
- move timing/progression/state-machine concerns into SparkSuite-owned runtime objects
- keep rendering/input boundaries thin

Acceptance criteria:
- runtime loops are primarily engine-owned for the most important migrated flows

### 4. Shrink the Bridge Layer

Goal:
- ensure bridges are only compatibility/sync surfaces

Required work:
- move any remaining decision-making logic out of bridges into engines/domain objects
- keep bridge methods focused on state projection and persistence compatibility

Acceptance criteria:
- bridge files are mostly field mapping, sync, and persistence glue

## Suggested Order

1. Add core-owned runtime state model
2. Move major page consumers onto that model
3. Migrate important live loops toward engine-owned runtime objects
4. Thin the bridge layer afterward

## Progress

### 2026-08-28: engine-owned runtime-state projection (pilot: guided sessions)

`SparkCore` already had a stable `runtimeState` shape plus `getRuntimeState()`/
`updateRuntimeState()` (see `js/sparksuite/core/spark_core.js`,
`createInitialRuntimeState`). What Phase 2 still needed was goal 1's second
acceptance criterion: legacy `S.*` fields getting updated *from* that engine
state instead of bridges re-deriving their own copy of the mapping.

Before this: each action family in `js/actions/*_family.js` hand-wrote its
own "mirror" function (e.g. `mirrorGuidedRuntimeFields` in
`system_family.js`) that picked a handful of fields off
`core.getRuntimeState()` and copied them onto `S` — one bespoke, undocumented
field map per flow, free to drift from what the engine actually considers
canonical.

Added `SparkCore.RUNTIME_STATE_PROJECTIONS` (a named registry of pure
`runtimeState -> legacy field object` functions) and
`SparkCore.prototype.projectRuntimeStateFields(domain, runtimeState)` to read
it. The `guided` domain is the pilot migration:
`mirrorGuidedRuntimeFields` in `system_family.js` now delegates to
`core.projectRuntimeStateFields("guided", runtimeState)` instead of
re-deriving the field list itself. Pinned by
`tests/test_runtime_state_projection.js`.

This is the seed of "shrink the bridge layer" (goal 4): the field mapping now
lives next to `SparkCore`, not scattered across action families. Extending
this to other flows means adding one function to
`RUNTIME_STATE_PROJECTIONS` and switching that flow's mirror call site — no
new mechanism needed.

### 2026-08-28: performance/song runtime context (second migration)

`js/actions/performance_family.js` had two independent copies of "prefer the
engine's runtime state field, else fall back to the legacy S value" —
`performStartFromSong` (5 fields: song index/title, difficulty, speed, target
technique) and `performRetryPhrase` (target technique only) — each with its
own presence check per field, and the two copies had already drifted: one
used a pure `hasOwnProperty` check on `performanceTargetTechnique`, the other
additionally re-fell-back to `S` whenever the engine value was falsy, so an
explicit "no target technique" from the engine (`null`) was silently
overridden by stale `S` state in one of the two call sites but not the other.

Added `performanceSongContext` to `RUNTIME_STATE_PROJECTIONS`. It's a pure
`(runtimeState, fallback) -> fields` function — the field-by-field precedence
rule (which check applies to which field) is engine-owned and single-sourced;
call sites only supply their fallback values. `projectRuntimeStateFields`
now takes that `fallback` as a third argument. Both call sites in
`performance_family.js` were migrated, resolving the drift in the engine's
favor (an explicit engine `null` now wins over stale `S` at both sites).
Pinned by the additional cases in `tests/test_runtime_state_projection.js`.

Remaining candidates for the next slice: the song mirror sites in
`orchestrator-requests.js` (`syncSongRuntimeRequest`,
`applySongNavigationRequest`) write `updateRuntimeState` directly rather than
mirroring runtime state onto `S`, so they aren't a fit for this same
projection shape — a future slice should look at whether `S.songPlaying` /
`S.songBeat` (still set independently of `runtimeState` in
`js/actions/song_family.js`) should instead be derived the same way.

## Honest Exit Criteria

We can call Phase 2 done when:

- `SparkCore` is the authoritative owner for runtime/session state
- pages read core state first
- bridges are thin
- the legacy shell is mostly a container and compatibility projection
