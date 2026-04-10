# Vertical Slice – Ukulele (End-to-End)

## Flow
1. User starts session
2. SparkCore builds SessionPlan
3. UI renders segments
4. Gameplay produces results
5. SparkCore processes results

## Example
const session = SparkCore.startSession({ instrument: "ukulele" });

SessionPlan:
- lesson
- difficulty
- segments
- exercises
- rewards

## UI Rule
UI must only render segments.

## Completion
const outcome = SparkCore.completeSession(results);

## Done Criteria
- Full loop works without UI logic
