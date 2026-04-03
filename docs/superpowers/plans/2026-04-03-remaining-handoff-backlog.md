# SparkSuite Remaining Handoff Backlog

Updated: 2026-04-03

## Purpose

This document is the trimmed follow-up to the larger status tracker. It lists only the meaningful work still unresolved from the current SparkSuite handoffs and roadmap, based on the repo state after the latest migration passes.

Use this as the practical backlog for "what is still left," without re-reading the full implementation history.

## Current Summary

The repo is no longer missing the major platform scaffolding.

Already true:
- `SparkCore` is real and central
- major session families have explicit core-backed request helpers
- performance, guided, daily practice, songs, dashboard, editor, and many utility flows now have core-backed runtime paths
- guitar, piano, bass, and ukulele all exist in the SparkSuite instrument layer
- rhythm/import/performance architecture is implemented beyond a stub

Still true:
- the app is still in a hybrid migration state
- `S.*` remains the practical persistence/runtime substrate in many places
- several flows are mirrored into core rather than fully owned by core runtime/domain objects

## Must Finish For Phase 1

### 1. Finish Remaining Runtime Ownership

Goal:
- no major user flow should depend on legacy orchestration for correctness

Still open:
- older tool/utility flows beyond simple settings snapshots
- remaining non-performance live loop families that are mirrored into core but not actually engine-owned
- any instrument-local branches that still rely on local shell behavior for correctness instead of using shared request helpers plus shared runtime ownership

Best next slices:
- utility families beyond screen ownership and shallow snapshots
- remaining shared mini-game/runtime flows that still use shell-owned timers/state machines
- any parallel instrument behavior not yet covered by focused runtime tests

### 2. Finish Progression Convergence

Goal:
- one authoritative progression path per flow

Still open:
- bridge layers still do more than pure projection in a few places
- `S.*` is still the final persistence model
- some recommendation/weak-spot surfaces still consume compatibility-era state rather than a true engine-owned domain profile

Best next slices:
- move more progression state shaping into core/domain objects
- reduce bridge logic to projection/sync where possible
- align recommendation inputs with the newer core-owned outputs

### 3. Bring Bass to Real Phase 1 Parity

Goal:
- bass should be a real migrated instrument, not just a registered adapter with partial runtime coverage

Still open:
- authored bass content depth
- broader bass performance/practice parity
- stronger bass-specific module/runtime identity beyond the currently migrated guided/practice surfaces

### 4. Finish Ukulele Phase 1 Parity

Goal:
- ukulele should feel like a real instrument track, not an early content slice

Still open:
- more authored lessons and exercises
- more performance chart coverage
- broader song/performance depth
- stronger module-specific progression/recommendation follow-through

### 5. Finish Rhythm-Highway Phase 1 Parity

Goal:
- move from "strong first slice" to "matches handoff intent in real use"

Still open:
- richer assist modes
- deeper loop and micro-loop tooling
- broader authored rhythm content
- broader instrument-specific rhythm support

### 6. Finish Import/Performance Parity

Goal:
- imported charts should feel production-ready enough for Phase 1

Still open:
- more robustness around import edge cases
- deeper imported-technique behavior in shared rendering
- stronger analytics/recommendation follow-through for imported content

## Main Phase 2 Gaps

### 1. `S.*` Is Still The Real Substrate

This is still the biggest architectural mismatch with the roadmap.

Current state:
- `SparkCore` owns much more runtime/session state than before
- pages increasingly read core state first
- but many flows still ultimately depend on `S.*` as the practical source of truth

### 2. Live Loops Are Still Mostly Outside Engine-Owned Runtime Objects

Current state:
- performance, session, drill, and tool flows now mirror more state into core
- but the important live loops/timers/transport ownership are still largely shell-owned

This is the biggest remaining Phase 2 convergence gap after state ownership.

### 3. Bridges Are Cleaner, But Not Thin Yet

Current state:
- bridges are much less ad hoc
- but some still contain meaningful compatibility logic, not just projection

End-state target:
- engines/domain objects own behavior
- bridges mainly sync/projection/persistence compatibility

### 4. Pages Are Core-First In Many Places, Not Everywhere

Current state:
- several major pages now prefer core-backed session/runtime state
- some screens still lean heavily on legacy shell state for rendering details

Most likely remaining page families:
- utility/tool screens beyond the current settings/MIDI snapshot slice
- long-tail legacy surfaces that still read shell state first

## Lower-Priority But Real Product Gaps

### 1. Shared Renderer Parity For Imported Techniques

Current state:
- imported techniques affect conversion, scoring, preview, hit color, and overlay behavior
- the shared note sprite/highway renderer still has more generic treatment underneath

### 2. Utility Family Depth

Current state:
- utility screens now have explicit open/return helpers
- settings and MIDI now have a first core-backed state slice
- cloud/curriculum/import workflows are still more shell-owned than session families

### 3. Long-Tail Instrument Polish

Current state:
- guitar is still the strongest path
- piano is much more converged than before
- bass and ukulele still need deeper authored parity and product depth

## Recommended Next Order

1. Finish the biggest remaining Phase 1 gaps:
- runtime ownership
- progression convergence
- bass parity
- ukulele parity
- rhythm/import parity

2. Keep Phase 2 moving in parallel where it has the highest payoff:
- reduce `S.*` dependence
- move more live loops into engine-owned runtime paths
- thin the bridge layer

3. Save true Phase 3 work for later:
- replacing the legacy shell wholesale
- deleting major compatibility pathways
- deeper platform/editor/content polish beyond handoff compliance

## Honest Status

The app is now credibly on the roadmap and no longer just "inspired by" it.

But it is not yet fully handoff-complete, and it is definitely not at the final architecture described by the roadmap.

The remaining work is now mostly:
- convergence
- parity depth
- reducing legacy ownership

not missing foundational systems.
