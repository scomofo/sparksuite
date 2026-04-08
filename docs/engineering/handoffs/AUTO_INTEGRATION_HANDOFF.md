# Auto-Integration Handoff

## Goal

Build the next layer on top of the instrument generator pipeline so a generated instrument can be moved into the real repo structure with minimal manual work.

Target outcome:

```text
generate scaffold → validate → suggest fixes → apply into repo paths safely
```

This handoff is specifically for the move from **artifact generation** to **safe repo integration**.

---

## Current State

The repo now has:
- a template system
- a scaffold generator
- a curriculum validator
- a fix suggestion script
- CI guardrails
- generated auto-registration artifacts

What is still missing is a safe way to move generated output into the real repo paths without hand-copying everything.

---

## Problem To Solve

Right now the generator can produce:
- `generated/instruments/<instrumentId>/...`
- `auto_registration.json`
- `runtime_register.generated.js`
- `integration_plan.md`

But a developer still has to manually:
- create target directories
- copy files into `js/sparksuite/instruments/<instrumentId>/`
- create runtime registration stubs under `js/instruments/<instrumentId>/`
- check what was or was not applied

That keeps the final mile manual.

---

## Required Deliverables

### 1. Safe apply script
Create an apply tool that consumes generated output and writes it into repo target paths.

Recommended command:

```bash
node scripts/apply_generated_instrument.js --instrument mandolin
```

### 2. Safe copy rules
The apply step should:
- copy generated SparkSuite module files into `js/sparksuite/instruments/<instrumentId>/`
- create runtime registration stubs in `js/instruments/<instrumentId>/`
- generate an application report
- avoid mutating unrelated central files automatically

### 3. Explicit non-goal
Do **not** automatically patch complex existing central files unless there is a proven safe insertion strategy.

For now, auto-integration should be:
- append-only where safe
- file-creation-based where safe
- report-driven for anything ambiguous

### 4. Reporting
The apply step should generate a report describing:
- source files
- destination files
- files written
- files skipped
- next manual follow-ups

### 5. Idempotence
Running apply repeatedly should not silently corrupt output.
At minimum, it should:
- detect existing files
- skip or require explicit overwrite mode
- report conflicts clearly

---

## Recommended Script Contract

### Input
- `--instrument <id>`
- optional `--overwrite`

### Output
- writes files into repo structure
- prints summary
- writes `generated/instruments/<id>/apply_report.json`
- writes `generated/instruments/<id>/apply_report.md`

---

## Safe Initial Scope

A good first version should handle:
- copying generated module files into SparkSuite path
- creating runtime `register.js`
- creating runtime `index.js`
- creating a generated README / integration note

It does **not** need to patch:
- launcher internals
- central app boot order
- adapter registries with fragile string replacement

Those can stay manual until a safer structured patching strategy exists.

---

## Target Paths

For instrument `mandolin`:

```text
js/sparksuite/instruments/mandolin/
js/instruments/mandolin/
```

Expected files may include:
- `<instrument>_skill_tree.js`
- `<instrument>_lessons.js`
- `<instrument>_exercises.js`
- `<instrument>_module.js`
- `index.js`
- `register.js`
- `README.generated.md`

---

## Definition of Done

This handoff is complete when:
- a generated instrument can be safely applied into repo target paths
- the apply step produces a clear report
- repeated runs do not silently clobber files
- manual follow-up items remain explicit
- the system moves the repo closer to one-command prototyping without unsafe central-file mutation
