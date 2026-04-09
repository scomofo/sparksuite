# SparkSuite – Repository Guide for Claude / Codex / AI Coding Agents

## Purpose

SparkSuite is a multi-instrument music learning platform in active migration.

This repo contains:

* legacy runtime systems
* SparkSuite core engines
* a full instrument generation, validation, and integration pipeline

All work must reflect **real repo structure AND pipeline-driven development**.

---

## Core Rule

Prefer:

* engine-owned logic
* instrument-owned behavior
* pipeline-driven content generation

Avoid:

* UI-driven business logic
* manual multi-file instrument setup
* bypassing validation or generator systems

---

## Instrument Pipeline System (CRITICAL)

SparkSuite includes a full **Instrument Pipeline System**:

    Templates -> Generator -> Validator -> Fix Engine -> Auto-Integration -> CI -> Discovery

### Key Scripts

* scripts/generate_instrument_pipeline.js
* scripts/validate_curriculum.js
* scripts/suggest_curriculum_fixes.js
* scripts/apply_generated_instrument.js

### Key Docs

* docs/engineering/INSTRUMENT_GENERATOR_PIPELINE.md
* docs/engineering/CURRICULUM_CONTRACT.md
* docs/engineering/INSTRUMENT_DEBUG_GUIDE.md

---

## Instrument Creation (MANDATORY WORKFLOW)

DO NOT manually create instruments across folders.

Use:

    node scripts/generate_instrument_pipeline.js --instrument <id> --template <template>
    node scripts/validate_curriculum.js
    node scripts/apply_generated_instrument.js --instrument <id>

If this flow is not used, the implementation is invalid.

---

## Auto-Discovery System

SparkSuite uses **manifest-based auto-discovery** for instruments.

### Files

* js/instruments/instrument_manifest.generated.js
* js/instruments/discovery_loader.js

### How it works

* Instruments are registered in a manifest
* Loader dynamically injects scripts at runtime
* No per-instrument edits to index.html

### Critical Constraint

Browsers cannot scan directories.
Discovery MUST be manifest-driven, NOT filesystem-driven.

---

## Critical Rules

1. DO NOT hardcode instruments into index.html
2. DO NOT manually wire instruments across multiple systems
3. ALWAYS use the generator pipeline
4. VALIDATOR must pass before integration
5. MANIFEST is the source of truth for discovery

---

## Architecture Reminder

* js/instruments/ -- runtime layer
* js/sparksuite/instruments/ -- module/content layer
* instrument-adapter.js -- bridge layer

All three must remain aligned.

---

## Validation Standard

A valid instrument must satisfy:

    Lesson -> Skill -> Exercise -> Gameplay -> Progress

If any link is missing, the instrument is broken.

---

## Guiding Principle

SparkSuite is a generated, validated, and enforced instrument platform.

---

## Anti-Patterns

Do NOT:

* copy/paste existing instrument folders
* create lessons without exercises
* create skills without gameplay support
* fix UI without fixing underlying data
* bypass validator or CI

---

## Definition of Done (Instrument)

An instrument is complete when:

* generated via pipeline
* validator passes (0 issues)
* exercises exist for all lesson skills
* gameplay renders correctly
* progress updates correctly
* auto-discovery loads it without manual wiring

---

## Final Rule

If an instrument is not generated, validated, integrated via pipeline,
and discoverable via manifest, then it is **invalid implementation**.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
