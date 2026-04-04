# Session Contracts

Normalized data contracts used by the engine-first architecture.

## SessionPlan

Returned by `SparkCore.startSession()` and `SparkSession.buildSession()`.

```javascript
{
  sessionId: "sp_1712345678_abc123",  // unique ID
  instrumentId: "chordspark",          // active instrument app ID
  instrumentType: "guitar",            // instrument type
  mode: "quickStart",                  // quickStart | guided | chord | drill
  lessonRef: null,                     // curriculum lesson ID (if applicable)
  segments: [],                        // session segments or drill chord list
  exercises: [],                       // exercise list
  goals: [],                           // session goals
  difficulty: 1,                       // difficulty level
  estimatedDuration: 120,              // seconds
  chord: { name: "C", ... },          // primary chord object (quickStart/chord modes)
  chordName: "C",                      // chord name shorthand
  metadata: {}                         // arbitrary extra data
}
```

Created via: `SparkContracts.createSessionPlan(opts)`

## SessionResult

Submitted by pages/flows on session completion.

```javascript
{
  sessionId: "sp_1712345678_abc123",
  mode: "session",                     // session | drill | song | guided | daily | rhythm | runner | practice
  instrumentId: "chordspark",
  instrumentType: "guitar",
  exerciseResults: [],                 // per-exercise outcomes
  accuracy: 0.85,                      // 0-1 normalized
  timing: null,                        // timing data if available
  duration: 120,                       // seconds
  songId: null,                        // for song/performance modes
  lessonRef: null,                     // curriculum lesson ID
  chordName: "C",                      // primary chord practiced
  completed: true                      // whether session completed normally
}
```

Created via: `SparkContracts.createSessionResult(opts)`

## ProgressOutcome

Returned by `SparkProgressOrchestrator.applySessionOutcome()` and `SparkCore.completeSession()`.

```javascript
{
  xpEarned: 10,                        // XP awarded
  levelUps: [],                        // [{ newLevel: 5 }] if leveled up
  masteryChanges: { "C": 85 },         // chord mastery updates
  unlocks: [],                         // newly unlocked content
  achievements: [],                    // newly earned achievements
  streakChanges: { incremented: true },// streak update or null
  comebackBonus: 0,                    // comeback XP bonus
  nextRecommendation: null             // suggested next action
}
```

Created via: `SparkContracts.createProgressOutcome(opts)`

## Flow

```
UI action → SparkCore.startSession(opts) → SessionPlan
  ↓
UI renders session from plan
  ↓
Session completes → SparkCore.completeSession(result) → ProgressOutcome
  ↓
UI renders outcome summary
```
