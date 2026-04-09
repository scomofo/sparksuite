# SparkSuite -- CLAUDE.md (Architecture Enforcement Guide)

## PURPOSE
Defines how all AI agents (Claude, Codex, etc.) must interact with SparkSuite.

SparkSuite is a **system-driven adaptive learning engine**, NOT a UI-driven app.

---

# CORE RULE (NON-NEGOTIABLE)

```text
SessionEngine -> SessionPlan -> UI renders
```

* UI NEVER makes decisions
* UI NEVER constructs sessions
* UI NEVER mutates session data

If UI makes decisions -> architecture is broken

---

# SYSTEM LAYERS

## 1. SessionEngine (ORCHESTRATOR)

ONLY source of truth for what the user does.

Responsible for:

* building SessionPlan
* sequencing segments
* injecting practice / song / challenge
* integrating LearningBrain + Flow

```js
const session = SessionEngineV2.buildSession({
  user,
  instrument,
  lesson,
  recentEvents
});
```

---

## 2. PracticeEngine (PURE GENERATOR)

Returns ONLY:

```js
{
  segments,
  exercises
}
```

Rules:

* NO UI fields
* NO labels / descriptions
* NO rendering concerns
* MUST be deterministic

---

## 3. LearningBrain

Responsible for:

* weakest skill detection
* emotion detection (frustrated / bored / engaged)
* recommendation (practice / challenge / balanced)

---

## 4. Flow System

Responsible for:

* difficulty adjustment
* maintaining engagement

---

## 5. Instrument Layer

Responsible for:

* exercise construction
* gameplay payload generation

```js
instrument.buildSongExercise()
instrument.buildRhythmExercise()
instrument.buildChallengeExercise()
```

---

# SESSION PLAN CONTRACT (STRICT V2)

```js
{
  id,
  flow,
  instrumentId,
  lesson,
  difficulty,

  segments: [
    {
      id,
      type, // "practice" | "song" | "challenge"
      exerciseIds: []
    }
  ],

  exercises: [
    {
      id,
      type,
      data
    }
  ],

  rewards
}
```

---

# FORBIDDEN IN CORE (CRITICAL)

The following MUST NEVER appear in:

* SessionEngine
* PracticeEngine
* LearningBrain

NO label, title, description, subtitle, UI flags, display fields

If present -> REMOVE immediately

---

# RUNTIME LOOP (MANDATORY)

```js
function startSessionLoop(user) {
  const session = SessionEngineV2.buildSession({
    user,
    instrument,
    lesson,
    recentEvents: user.lastEvents || []
  });

  runSession(session);
}
```

---

## Gameplay -> Event Capture

```js
state.events.push(event);
```

---

## Session Completion

```js
user.lastEvents = state.events;
startSessionLoop(user);
```

---

# UI CONTRACT

UI MUST ONLY:

```js
render(sessionPlan);
```

UI MUST NOT:

* generate exercises
* choose next step
* modify session
* inject data

---

# ARCHITECTURAL RULES

## 1. No Bypass

If anything runs without SessionEngine -> WRONG

---

## 2. No Duplication

If logic exists in UI AND engine -> WRONG

---

## 3. Normalization Required

* segments reference exercises
* exercises hold all data

---

## 4. Single Source of Truth

SessionPlan is the ONLY source of runtime structure

---

# INSTRUMENT PIPELINE SYSTEM (CRITICAL)

SparkSuite includes a full Instrument Pipeline System:

    Templates -> Generator -> Validator -> Fix Engine -> Auto-Integration -> CI -> Discovery

### Key Scripts

* scripts/generate_instrument_pipeline.js
* scripts/validate_curriculum.js
* scripts/suggest_curriculum_fixes.js
* scripts/apply_generated_instrument.js

DO NOT manually create instruments across folders. Use the pipeline.

---

# AUTO-DISCOVERY SYSTEM

SparkSuite uses manifest-based auto-discovery for instruments.

* js/instruments/instrument_manifest.generated.js
* js/instruments/discovery_loader.js

Discovery MUST be manifest-driven, NOT filesystem-driven.

---

# ARCHITECTURE LAYERS

* js/instruments/ -- runtime layer
* js/sparksuite/instruments/ -- module/content layer
* instrument-adapter.js -- bridge layer

All three must remain aligned.

---

# VALIDATION STANDARD

A valid instrument must satisfy:

    Lesson -> Skill -> Exercise -> Gameplay -> Progress

If any link is missing, the instrument is broken.

---

# DEVELOPMENT PRIORITIES

When modifying the system:

1. Update engines FIRST
2. Maintain SessionPlan contract
3. Keep UI passive
4. Avoid shortcuts

---

# CODING GUIDELINES

## 1. Think Before Coding

* State assumptions explicitly. If uncertain, ask.
* If multiple interpretations exist, present them.
* If a simpler approach exists, say so.

## 2. Simplicity First

* No features beyond what was asked.
* No abstractions for single-use code.
* No error handling for impossible scenarios.

## 3. Surgical Changes

* Touch only what you must.
* Match existing style.
* Remove only what YOUR changes made unused.

## 4. Goal-Driven Execution

* Transform tasks into verifiable goals.
* State a brief plan with verification steps.

---

# DESIGN PHILOSOPHY

SparkSuite is:

* system-first
* adaptive
* engine-driven
* data-normalized

NOT:

* screen-driven
* manually sequenced
* UI-controlled

---

# FINAL RULE

If it works but violates these rules -> it is technical debt.
If it follows these rules -> it scales cleanly.

This file is the source of truth for architecture enforcement.
