# ADR 004 - UI does not own progression

## Status
Accepted

## Context
SparkSuite pages need to display mastery, XP, unlocks, recommendations, and difficulty. That visibility can easily turn into ownership drift if UI starts calculating or mutating those values directly.

## Decision
UI displays progression outcomes but does not calculate or mutate them. Progression belongs to core engines and bridges.

## Consequences
This keeps gameplay outcomes reproducible and testable. It also means some UI code that "just tweaks one value" is architectural debt, not a shortcut.

## Allowed
- `gateway.execute(...)` calls for exercise or session completion.
- Rendering reward summaries, XP toasts, coaching notes, and progression cards from engine results.
- Reading normalized runtime state from `sparkCore`.

## Forbidden
- UI code that changes XP, mastery, unlocks, or lesson state directly.
- UI code that decides next lesson or difficulty.
- UI code that grants rewards or modifies progression counters by itself.

## Enforcement
- UI business-logic scan.
- Action registry and gateway usage.
- Progress and session contract tests.
- Code review against forbidden patterns like direct XP/mastery mutation.
