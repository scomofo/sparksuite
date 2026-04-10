# Performance Engine (Guitar Hero Style)

## Components
- NoteMapper
- TimingWindow
- InputHandler
- ScoringSystem

## Timing
perfect: <50ms
good: <100ms
miss: >100ms

## Flow
PracticeEngine → exercises
PerformanceEngine → play

## Input
{ timestamp, input }

## Output
{ accuracy, timing, mistakes }

## Rule
No instrument-specific logic in engine.
Use instrument modules.

## Done Criteria
- Works for guitar, ukulele, bass
