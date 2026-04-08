# Curriculum Contract

## Purpose

This document defines the **required structure and rules** for curriculum in SparkSuite.

Its goal is to prevent:
- lessons that cannot be executed
- skills without exercises
- broken progression paths
- mismatched gameplay output

If a curriculum violates this contract, it is considered **invalid**.

---

## 🔥 Core Principle

A lesson is only valid if it is **playable end-to-end**.

That means:

Lesson → Skill → Exercise → Gameplay → Progress

If any link is missing, the lesson is broken.

---

## 🧱 Required Entities

Every curriculum must define:

### 1. Skills

Each skill must:
- have a unique ID
- exist in the skill tree
- represent a teachable capability

Example:
```json
{
  "id": "down_strum",
  "name": "Down Strumming",
  "category": "rhythm"
}
```

---

### 2. Lessons

Each lesson must:
- have a unique ID
- reference ONLY valid skills
- represent a logical progression step

Example:
```json
{
  "id": "uke_01",
  "skills": ["down_strum"]
}
```

---

### 3. Exercises

Each skill must map to exercises.

Requirement:
- EVERY skill used in any lesson MUST have at least one exercise generator

Violation example:
- lesson references `barre_chords`
- no exercises exist → lesson is invalid

---

### 4. Gameplay Output

Exercises must produce valid gameplay data:

- supported by PracticeEngine
- consumable by performance-core
- renderable in UI

---

### 5. Progress Tracking

Each lesson must:
- be completable
- update progress consistently

---

## 🧪 Validation Rules

A curriculum is valid ONLY if:

### Rule 1 — Skill Coverage
All skills referenced in lessons exist in the skill tree

### Rule 2 — Exercise Coverage
All skills have at least one exercise

### Rule 3 — Gameplay Compatibility
All exercises produce valid playable output

### Rule 4 — Progress Compatibility
Completion updates correct progress state

### Rule 5 — No Orphan Content
No unused skills, lessons, or exercises

---

## ⚠️ Common Violations

### 1. Lesson Expansion Without Support
Adding lessons with new skills but:
- no exercises
- no chart support

Result:
- empty gameplay

---

### 2. Partial Instrument Implementation
Updating:
- SparkSuite module layer

But not updating:
- runtime instrument layer
- adapter

Result:
- UI mismatch or crashes

---

### 3. Invalid Skill References
Lesson references skill that:
- doesn’t exist
- is misspelled

Result:
- silent failure or fallback behavior

---

### 4. Renderer Mismatch
Exercise produces data format not supported by renderer

Result:
- broken gameplay display

---

## 🧠 Enforcement Strategy

When adding or modifying curriculum:

1. Define skills
2. Add lessons referencing those skills
3. Implement exercises for every skill
4. Validate gameplay output
5. Verify progress updates

Never skip steps.

---

## ✅ Definition of Valid Curriculum

A curriculum is valid when:

- every lesson is playable
- every skill is supported
- every exercise renders correctly
- progression flows without gaps

---

## 🔁 Quick Validation Checklist

Before shipping:

- [ ] All lesson skills exist
- [ ] All skills have exercises
- [ ] Exercises produce gameplay
- [ ] Gameplay renders correctly
- [ ] Lessons can be completed
- [ ] Progress updates correctly

---

## Final Rule

A lesson that cannot be played is not a lesson.

It is a bug.
