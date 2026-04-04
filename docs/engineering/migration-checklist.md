# SparkSuite Migration Checklist

Tracks which flows use the new engine contracts vs legacy direct-call paths.

## Legend
- **Dual-path**: Both legacy and contract paths run (validation phase)
- **Contract-only**: Fully migrated to engine contracts
- **Legacy-only**: Not yet migrated

## Session Planning (Phase 2)

| Flow | SessionPlan Contract | Status |
|------|---------------------|--------|
| quickStart | Yes (via wrapPlan) | Dual-path |
| guided | Yes (via wrapPlan + lessonRef) | Dual-path |
| chord | Yes (via wrapPlan) | Dual-path |
| drill | Yes (via wrapPlan) | Dual-path |

## Progress Outcomes (Phase 3)

| Flow | applySessionOutcome | Status |
|------|-------------------|--------|
| quickStart timer complete | Yes | Dual-path |
| drill timer complete | Yes | Dual-path |
| performance finish | Yes | Dual-path |
| guided session complete | No | Legacy-only |
| daily challenge complete | No | Legacy-only |
| runner game complete | No | Legacy-only |
| rhythm game complete | No | Legacy-only |

## Instrument Contracts (Phase 4)

| Instrument | Capability Flags | Normalized Methods | Status |
|-----------|-----------------|-------------------|--------|
| Guitar | Yes | getData() only | Partial |
| Ukulele | Yes | getData() only | Partial |
| Piano | Yes | getData() only | Partial |
| Bass | Yes | getData() only | Partial |

## Curriculum (Phase 5)

| Feature | Service API | Status |
|---------|-----------|--------|
| getNextLesson | SparkCurriculumService.getNextLesson | Available |
| isLessonUnlocked | SparkCurriculumService.isLessonUnlocked | Available |
| getLessonById | SparkCurriculumService.getLessonById | Available |
| getReviewTargets | SparkCurriculumService.getReviewTargets | Stub |
| SessionEngine guided mode | Uses CurriculumService | Dual-path |

## Performance Integration (Phase 6)

| Flow | Unified Result Schema | Status |
|------|---------------------|--------|
| Performance song finish | SessionResult contract | Dual-path |
| Practice engine finish | No | Legacy-only |

## Legacy Removal (Phase 7)

No legacy paths have been retired yet. All migrated flows run dual-path for safety.

### Retirement criteria
- Dual-path flow must produce matching outcomes for 2+ weeks
- Console.debug logs show no discrepancies
- Then legacy path can be removed

## Next Steps

1. Migrate guided session completion to applySessionOutcome
2. Migrate daily challenge completion to applySessionOutcome
3. Add normalized methods (getExercisesForLesson, etc.) to instrument contracts
4. Wire practice engine completion through contracts
5. Begin retiring legacy paths once dual-path validation passes
