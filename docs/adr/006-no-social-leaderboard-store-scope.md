# ADR 006 - No social, leaderboard, or store scope

## Status
Accepted

## Context
SparkSuite's current milestone is a reliable, local-first music learning runtime. Social, competitive, and commerce systems would add complexity without helping that goal.

## Decision
Do not add social systems, leaderboards, marketplaces, or stores in the current architecture and production-readiness passes.

## Consequences
This keeps the backlog focused on runtime reliability, content authoring, packaging, validation, and QA. It also prevents distracting "future-ready" scaffolding that increases maintenance cost now.

## Allowed
- Local debug export.
- Local user progress export/import.
- Local practice journals or internal authoring tooling.
- Internal lesson/chart pipelines for SparkSuite content.

## Forbidden
- Leaderboards.
- Friend systems.
- Follow/follower systems.
- Public profiles.
- Social feeds or social sharing systems.
- Marketplace or creator marketplace scaffolding.
- Paid content store hooks or commerce surfaces.

## Enforcement
- Scope review in handoff checklists.
- ADR review for new architectural work.
- Production-readiness verification that no social/store surface area was added.
