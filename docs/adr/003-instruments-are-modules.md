# ADR 003 - Instruments are modules

## Status
Accepted

## Context
SparkSuite supports guitar, piano, bass, and ukulele, with more instruments possible later. If core engines special-case each instrument, extension becomes fragile and expensive.

## Decision
Adding or changing an instrument should happen through an instrument module and its validated content, not through special cases in core engines.

## Consequences
This keeps the core runtime smaller and makes modularity testable. It also means instrument contract failures must stop registration early instead of failing halfway through a session.

## Allowed
- Instrument modules exposing `getSkillTree()`, `getLessons()`, `getExercises()`, `getTuning()`, and `getCapabilities()`.
- Instrument-specific content, render hints, lane metadata, and exercise definitions inside instrument modules or authored content files.
- Instrument adapters that normalize legacy shells into the shared contract.

## Forbidden
- `if (instrument === "ukulele")` or similar branching inside `SessionEngine`, `ProgressEngine`, `CurriculumEngine`, or scoring systems.
- Hardcoded string counts or lane semantics inside generic core engines.
- Registering instruments that do not satisfy the module contract.

## Enforcement
- `InstrumentManager` fail-fast registration.
- Content and instrument validation scripts.
- Canary instrument tests.
- CI contract checks for registered instrument modules.
