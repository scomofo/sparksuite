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

## Honest Exit Criteria

We can call Phase 2 done when:

- `SparkCore` is the authoritative owner for runtime/session state
- pages read core state first
- bridges are thin
- the legacy shell is mostly a container and compatibility projection
