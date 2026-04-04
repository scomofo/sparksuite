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

## Progress Outcomes (Phase 3/6)

| Flow | applySessionOutcome | Status |
|------|-------------------|--------|
| quickStart timer complete | Yes | Dual-path |
| drill timer complete | Yes | Dual-path |
| performance finish | Yes | Dual-path |
| guided session complete | Yes | Dual-path |
| daily challenge complete | Yes | Dual-path |
| runner game complete | Yes | Dual-path |
| rhythm game complete | Yes | Dual-path |
| practice engine finish | Yes | Dual-path |

## Instrument Contracts (Phase 4)

| Instrument | Capability Flags | Normalized Methods | Status |
|-----------|-----------------|-------------------|--------|
| Guitar | Yes | getExercisesForLesson, getPerformanceConfig | Complete |
| Ukulele | Yes | getExercisesForLesson, getPerformanceConfig | Complete |
| Piano | Yes | getExercisesForLesson, getPerformanceConfig | Complete |
| Bass | Yes | getExercisesForLesson, getPerformanceConfig | Complete |

## Curriculum (Phase 5)

| Feature | Service API | Status |
|---------|-----------|--------|
| getNextLesson | SparkCurriculumService.getNextLesson | Available |
| isLessonUnlocked | SparkCurriculumService.isLessonUnlocked | Available |
| getLessonById | SparkCurriculumService.getLessonById | Available |
| getReviewTargets | SparkCurriculumService.getReviewTargets | Implemented |
| SessionEngine guided mode | Uses CurriculumService | Dual-path |

## Performance Integration (Phase 6)

| Flow | Unified Result Schema | Status |
|------|---------------------|--------|
| Performance song finish | SessionResult contract | Dual-path |
| Practice engine finish | SessionResult contract | Dual-path |

## Legacy Removal (Phase 7)

No legacy paths have been retired yet. All migrated flows run dual-path for safety.

### Retirement criteria
- Dual-path flow must produce matching outcomes for 2+ weeks
- Console.debug logs show no discrepancies
- Then legacy path can be removed

## Remaining Work

1. Add `buildLearningQueue(userContext)` to CurriculumService
2. Refactor SessionEngine to ask CurriculumEngine for lesson choices (not just lock check)
3. Add InstrumentAdapter normalized methods to spark-core (proxy getExercisesForLesson, getPerformanceConfig)
4. Wire recommendation engine through SparkCore services
5. Begin retiring legacy paths once dual-path validation passes
6. Add scriptable smoke checks (automated boot + flow tests)
