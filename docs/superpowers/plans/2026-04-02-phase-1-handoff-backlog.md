# SparkSuite Phase 1 Backlog

Updated: 2026-04-02

## Purpose

This document defines the realistic `Phase 1` target for SparkSuite: make the app `handoff-complete enough` in behavior and architecture without requiring a full replacement of the legacy app shell.

This is intentionally narrower than full end-state architectural parity.

## Phase 1 Definition

Phase 1 is complete when:

- SparkSuite core owns every major user flow for correctness.
- Legacy app files no longer hide important business logic that can bypass core decisions.
- Instruments expected by the handoffs are usable through the shared module/adapter/runtime path.
- Rhythm, chart import, performance, and progression behavior are complete enough to match handoff intent in real use.
- Compatibility bridges still exist, but are clearly compatibility layers rather than shadow owners.

Phase 1 does **not** require:

- removing `S.*` entirely
- replacing the full `act(...)` shell
- moving every live runtime loop into engine-owned runtime objects
- rewriting the whole routing layer

## Current Reality

Already in good shape:

- daily practice core ownership
- guided and performance-song session entry through `SparkCore`
- performance completion and persistence bridged through SparkSuite boundaries
- guitar, piano, bass, and ukulele adapter registration in default runtime
- first rhythm-highway slice
- `.chart` / `.mid` / package import path
- imported-chart performance conversion, scoring, preview, and overlay support
- first ukulele module plus first authored content slice

Still materially incomplete for Phase 1:

- some runtime orchestration still lives in legacy app/instrument files
- bass is registered but still not at the same authored/module depth as the stronger paths
- ukulele still needs more authored curriculum/performance content
- rhythm-highway still needs later-phase parity features
- imported-technique rendering still stops short of shared highway note-sprite parity
- some recommendation/analytics follow-through is still lighter than the handoffs imply

## Must-Do Backlog

### 1. Finish Remaining Runtime Ownership

Goal:
- ensure no major user flow depends on legacy orchestration for correctness

Required work:
- identify remaining practice/game/session flows whose results or progression can still bypass `SparkCore`
- route those flows through core start/completion APIs or a shared SparkSuite bridge
- remove duplicated reward/progression/state mutation from those paths

Priority areas:
- remaining non-performance session/drill/game loops in shared app runtime
- any remaining instrument-local guided/session branches not yet proven through focused tests
- any plan-generation or plan-completion paths still depending on fallback logic in normal operation

Acceptance criteria:
- every major flow uses `SparkCore` or a SparkSuite bridge for session ownership and result persistence
- legacy runtime files are orchestration-only, not progression owners
- focused regression tests exist for each newly migrated runtime island

### 2. Finish Progression Convergence

Goal:
- make one progression pipeline authoritative per flow

Required work:
- audit remaining XP, badge, unlock, streak, and mastery writes
- move any remaining duplicated writes behind SparkSuite bridge helpers
- ensure recommendation and weak-spot systems consume the same authoritative outputs

Priority areas:
- legacy practice/game result handlers
- remaining performance progression helpers that still assume local state shape
- weak-spot and recommendation surfaces that still read stale or partially duplicated state

Acceptance criteria:
- no major flow has two separate progression paths in normal use
- bridge/helpers own compatibility writes
- recommendation surfaces reflect the migrated performance/practice outputs consistently

### 3. Bring Bass to Real Phase 1 Parity

Goal:
- bass should be more than merely registered

Required work:
- decide whether bass needs a fuller SparkSuite module or a stronger adapter-backed content surface
- ensure bass guided/practice/performance paths are covered to the same minimum standard as piano/guitar
- add focused regression tests for bass-specific core-backed flows

Acceptance criteria:
- bass is not just available in the registry, but behaves as a first-class migrated instrument
- at least one meaningful bass flow is covered through SparkSuite runtime tests

### 4. Finish Ukulele Phase 1 Parity

Goal:
- make ukulele feel like a real instrument track, not a scaffold

Required work:
- add more authored lessons/exercises/charts
- expand performance chart coverage beyond the current two-chart slice
- strengthen practice and rhythm progression coverage so ukulele participates naturally in daily planning and performance recommendations

Acceptance criteria:
- ukulele has enough authored curriculum and performance content to satisfy the module handoff intent
- ukulele is no longer described as “early” in the status doc

### 5. Finish Rhythm-Highway Phase 1 Parity

Goal:
- close the major gameplay/functionality gaps from the rhythm handoff

Required work:
- add assist-mode depth
- add better loop/micro-loop tooling
- expand authored rhythm content
- broaden instrument-specific rhythm payload coverage where the handoff expects it

Acceptance criteria:
- rhythm mode is clearly beyond the first playable slice
- major handoff items are implemented or explicitly downgraded with a documented reason

### 6. Finish Import/Performance Parity

Goal:
- make imported chart workflows feel production-ready enough for Phase 1

Required work:
- improve import robustness where needed
- deepen imported-technique behavior in gameplay/rendering
- ensure imported-chart results feed recommendations/analytics cleanly

Acceptance criteria:
- imported charts are not just parsable, but usable with believable parity in performance mode
- imported-technique behavior is visible and meaningful in both rendering and progression surfaces

## Nice-to-Have in Phase 1

- expand more chart package examples for ukulele and bass
- add more focused runtime migration tests for shared app actions
- improve internal docs so migrated vs legacy boundaries are clearer to future contributors

## Explicitly Not Phase 1

These belong to a later convergence phase:

- replace `S.*` as the persistence substrate
- replace `act(...)` as the app shell
- move all live gameplay loops into engine-owned runtime objects
- make pages render directly from core/domain state only
- remove the legacy shell entirely

## Suggested Implementation Order

1. Finish remaining runtime ownership
2. Finish progression convergence
3. Bring bass to real parity
4. Finish ukulele parity
5. Finish rhythm-highway parity
6. Finish import/performance parity

## Honest Exit Criteria

We can call Phase 1 done when:

- the app’s main user flows behave according to the handoffs
- the remaining legacy shell is mostly a compatibility container
- the unresolved work is mostly architectural end-state replacement, not missing product behavior

If those conditions are not true, Phase 1 is not done even if many bridges exist.
