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
