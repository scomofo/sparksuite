# ADR 002 - SessionPlan is canonical

## Status
Accepted

## Context
Loose session objects and UI-generated fallback segments make runtime behavior hard to trust and easy to regress. The session contract needs one canonical shape.

## Decision
Every playable SparkSuite session is represented by a validated `SessionPlan`. Runtime, UI, and bridges may project or display that plan, but they must not invent missing core fields.

## Consequences
This makes sessions easier to debug and safer to migrate. It also means malformed plans should fail early instead of "sort of working" in a page renderer.

## Allowed
- Validated `SessionPlan` objects with segments, exercises, difficulty, rewards, and context.
- Runtime helpers that read active segment and exercise data from the current `SessionPlan`.
- Legacy compatibility layers that project canonical plans into older view shapes without changing ownership.

## Forbidden
- Loose session objects without validated `segments` and `exercises`.
- Segment exercise references that do not resolve.
- UI-generated fallback exercises.
- Silent omission of required session fields.

## Enforcement
- `SessionPlan` constructor validation.
- `assertSessionPlan` runtime boundary checks.
- Session contract tests and fixture validation.
- CI verification for malformed session plans.
