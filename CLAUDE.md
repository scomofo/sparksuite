# SparkSuite – Claude / AI Coding Agent Guide

## Purpose
SparkSuite is an **engine-driven music learning platform**.

The system is NOT UI-first.
The system is NOT feature-first.

The system is:

Core Engine → Session → UI renders output

This document defines how AI agents must operate within this repository.

---

# 🔥 Core Rule (Non-Negotiable)

## ❌ DO NOT:
- Put logic in UI components
- Add business logic to app.js
- Hardcode lesson flow in pages
- Create "quick utilities" that bypass engines
- Couple gameplay logic directly to rendering

## ✅ DO:
- Route ALL logic through core engines
- Extend via engines or instrument modules
- Keep UI as a dumb renderer of session state

---

# 🧠 Architecture Overview

SparkCore
  ├── SessionEngine
  ├── CurriculumEngine
  ├── PsychologyEngine
  ├── PracticeEngine
  ├── ProgressEngine
  ├── InstrumentManager
  ├── Storage
  └── AIEngine
        ↓
Instrument Modules
        ↓
Session Plan
        ↓
UI Rendering Layer

Reference architecture defined in core skeleton doc.

---

# ⚙️ Engine Responsibilities

## SessionEngine
- Builds sessions
- Orchestrates all engines
- Returns SessionPlan

## CurriculumEngine
- Determines WHAT to learn next
- Skill trees
- Prerequisites
- Lesson sequencing

## PsychologyEngine
- Determines HOW learning is delivered
- Difficulty scaling
- Session structure
- Reward timing
- Flow state

## PracticeEngine
- Generates exercises
- Evaluates performance
- Handles gameplay logic abstraction

## ProgressEngine
- Tracks mastery
- XP, levels, streaks
- Unlocks

## InstrumentManager
- Registers and loads instrument modules
- No instrument logic in core

## AIEngine (future)
- Coaching
- Feedback
- Adaptive generation

---

# 🎸 Instrument Module Standard

Each instrument must be self-contained.

Example:

instruments/guitar/
instruments/piano/
instruments/ukulele/

Each module MUST expose:

{
  id,
  name,
  getSkillTree(),
  getLessons(),
  getExercises(skill),
  getChords(),
  getScales(),
  getTuning()
}

## Critical Rule
Adding a new instrument must NOT require changes to core engines.

---

# 🎮 Gameplay Model (Guitar Hero Inspired)

Gameplay is NOT hardcoded.

PracticeEngine outputs abstract exercises:

{
  type: "note_highway" | "chord" | "strum" | "pattern",
  difficulty,
  tempo,
  data
}

UI layer decides how to render:
- Note highway
- Chord prompts
- Rhythm lanes

---

# 🔄 Data Flow

User Profile
    ↓
SparkCore.startSession()
    ↓
SessionEngine
    ↓
Curriculum → Psychology → Practice
    ↓
SessionPlan
    ↓
UI renders
    ↓
User plays
    ↓
Results
    ↓
SessionEngine.processResults()
    ↓
Progress + Difficulty updated

---

# 🧱 Domain Models

Located in:

js/sparksuite/domain/

Key objects:
- SessionPlan
- Skill
- Lesson
- Performance
- Reward

These must remain UI-independent.

---

# 🚧 Migration Rules (VERY IMPORTANT)

We are currently migrating from:

❌ Old:
UI → decides everything

✅ New:
Engine → decides everything
UI → renders

## Migration Strategy
- Wrap existing flows through SparkCore
- Move logic incrementally into engines
- DO NOT rewrite entire app at once

---

# 🧪 Testing Expectations

When adding features:
- Can session be generated without UI?
- Can engine run in isolation?
- Does it work across instruments?

If not → architecture violation

---

# 🧩 Adding Features

## Add to:
- CurriculumEngine → learning decisions
- PsychologyEngine → difficulty & flow
- PracticeEngine → exercise generation
- ProgressEngine → tracking

## NEVER add to:
- UI components
- Pages
- Random helpers

---

# 🧠 Design Philosophy

SparkSuite is:

- Engine-first
- Data-driven
- Modular
- Instrument-agnostic
- Psychology-aware

NOT:

- Page-driven
- Hardcoded
- UI-controlled

---

# ⚠️ Common Failure Modes (Avoid These)

1. UI deciding lesson flow
2. Instrument logic leaking into core
3. Duplicating logic across instruments
4. Tight coupling between gameplay + rendering
5. “Quick fixes” outside engines

---

# 🚀 Definition of Done

A feature is complete when:

- It lives in the correct engine/module
- It works across multiple instruments
- It requires zero UI logic changes to function
- It can be tested via SessionEngine

---

# 🧭 Guiding Principle

If you remove the UI, SparkSuite should still function.

If that is not true, the architecture is wrong.

---

# 📌 Immediate Priority

Current focus:

1. Core engine scaffold (SparkCore + engines)
2. Route one full session through engine
3. Migrate guitar gameplay into PracticeEngine
4. Validate instrument modularity (guitar → ukulele test)

---

# 🤖 Instructions for AI Agents

When implementing anything:

1. Identify which engine owns the responsibility
2. Implement there
3. Expose via SessionEngine
4. Return structured data
5. Let UI render it

If unsure → default to engine, NOT UI

---

End of file.