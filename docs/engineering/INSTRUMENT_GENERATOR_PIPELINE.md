# Instrument Generator Pipeline

## Purpose

This pipeline exists to make new instrument creation structured, repeatable, and guardrailed.

Instead of adding a new instrument by hand across many files, the goal is to:

1. generate a valid scaffold
2. fill in instrument-specific content
3. run curriculum validation
4. fix gaps before merge

This reduces drift between:
- skill trees
- lessons
- exercises
- charts
- runtime adapters
- documentation

---

## Core Principle

A new instrument is not complete when files exist.

A new instrument is complete when:

Skill Tree → Lessons → Exercises → Gameplay → Progress → Runtime

all connect without gaps.

---

## Pipeline Stages

### 1. Generate scaffold
Use the generator script to create a starter package for a new instrument.

Expected output includes:
- skill tree stub
- lesson stub
- exercise stub
- module stub
- index stub
- manifest/plan file describing what was generated

### 2. Author content
Fill in:
- real skills
- real lessons
- real exercises
- real rhythm/chart mappings
- real songs/tuning/chords as needed

### 3. Validate curriculum
Run:

```bash
node scripts/validate_curriculum.js
```

This checks lesson-skill-exercise integrity.

### 4. Generate fix suggestions
Run:

```bash
node scripts/suggest_curriculum_fixes.js
```

This produces repair snippets for missing coverage.

### 5. Connect runtime layer
After module content is valid, connect:
- runtime instrument registration
- adapter/bridge layer
- launcher/UI integration
- progress/reporting paths

### 6. Merge only after guardrails pass
CI should block invalid curriculum from merging.

---

## Generator Output Strategy

The generator should create scaffolds in a safe staging area first.

Recommended location:
- `generated/instruments/<instrumentId>/`

This avoids polluting active runtime paths before content is reviewed.

Once stable, generated content can be moved into:
- `js/sparksuite/instruments/<instrumentId>/`
- any required runtime integration layer

---

## Minimum Valid Instrument Package

A generated instrument package should include at least:

- `<instrument>_skill_tree.js`
- `<instrument>_lessons.js`
- `<instrument>_exercises.js`
- `<instrument>_module.js`
- `index.js`
- `manifest.json`

Optional extras depending on instrument:
- chords
- scales
- tuning
- rhythm chart library
- adapter stubs
- runtime register stubs

---

## Guardrail Rules

Every generated instrument must satisfy:

1. skills exist before lessons reference them
2. lessons do not reference unknown prerequisites
3. every lesson skill has exercises
4. exercises are structurally valid
5. chart mappings exist for rhythm/gameplay-enabled instruments
6. generated docs reflect real repo paths

---

## Practical Workflow

Example:

```bash
node scripts/generate_instrument_scaffold.js --instrument mandolin --name Mandolin
node scripts/validate_curriculum.js
node scripts/suggest_curriculum_fixes.js
```

Then:
- review generated scaffold
- move approved files into active repo paths
- connect runtime integration
- open PR

---

## Non-Goal

The generator does not replace musical design.

It creates a structurally valid starting point.

A human still needs to:
- verify musical correctness
- verify pedagogy
- verify runtime behavior
- verify UI compatibility

---

## Final Rule

The generator should accelerate instrument creation.

It must never lower correctness standards.
