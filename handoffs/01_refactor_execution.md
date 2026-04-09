# Refactor Execution Handoff (Codex)

## Objective
Remove all learning logic from UI and route through SparkCore.

## Steps
1. Search UI for logic:
- lesson
- difficulty
- xp
- next
- level

2. Move logic:
- Lesson → CurriculumEngine
- Difficulty → PsychologyEngine
- XP → ProgressEngine
- Exercises → PracticeEngine

3. Replace UI flow:

BEFORE:
const lesson = lessons[i];

AFTER:
const session = SparkCore.startSession(user);

4. Delete all conditionals in UI related to learning.

5. Ensure SessionEngine returns SessionPlan.

## Done Criteria
- UI renders only
- SparkCore controls flow
