# ADR 001 - Engine-first architecture

## Status
Accepted

## Context
SparkSuite is being migrated away from page-owned lesson logic and app-wide state mutations. Without a written rule, future changes can drift back toward UI-driven sequencing, scoring, and progression.

## Decision
SparkSuite follows one primary data flow:

`Core Engine -> SessionPlan -> UI renders session`

Core engines own lesson choice, session structure, rewards, scoring, progression, and unlock logic. UI surfaces render the current session state and dispatch named actions through the gateway.

## Consequences
This makes session behavior more testable, instrument support more modular, and recovery/debugging more centralized. It also means some legacy UI shortcuts are no longer acceptable, even when they feel convenient.

## Allowed
- UI renders difficulty, rewards, summaries, and coaching notes from engine output.
- UI dispatches actions through `SparkActions` and `ExecutionGateway`.
- Core engines and instrument modules choose lessons, difficulty, rewards, scoring, progress, and unlocks.
- Runtime systems own note timing, hit detection, and scoring.

## Forbidden
- UI choosing the next lesson.
- UI mutating mastery, XP, unlocks, or difficulty.
- UI special-casing instrument learning behavior.
- Random globals or utilities deciding progression state.
- Reintroducing page-owned fallback session logic when core data is missing.

## Enforcement
- `SessionPlan` validation and contract tests.
- UI business-logic scan.
- Action registry and gateway checks.
- Content and instrument validation gates.
- Code review against this ADR set.
