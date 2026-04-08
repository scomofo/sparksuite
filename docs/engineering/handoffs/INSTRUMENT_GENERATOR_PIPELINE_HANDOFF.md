# Instrument Generator Pipeline Handoff

## Goal

Turn instrument creation into a repeatable pipeline instead of an ad hoc set of manual edits.

Target outcome:

```text
scaffold generation → curriculum validation → fix suggestion generation → runtime registration plan
```

This handoff is based on the current generator/validator/fix-suggestion system and extends it with:
- template-driven scaffolding
- auto-registration artifacts
- explicit integration outputs for runtime and SparkSuite module layers

---

## What Exists Already

Current guardrails now include:
- `CLAUDE.md`
- `docs/engineering/INSTRUMENT_DEBUG_GUIDE.md`
- `docs/engineering/CURRICULUM_CONTRACT.md`
- `scripts/validate_curriculum.js`
- `scripts/suggest_curriculum_fixes.js`
- `.github/workflows/curriculum-guardrails.yml`
- `scripts/generate_instrument_scaffold.js`
- `docs/engineering/INSTRUMENT_GENERATOR_PIPELINE.md`

The next step is to turn the simple scaffold generator into a stronger pipeline with templates and registration outputs.

---

## Problem To Solve

Right now the repo can:
- generate a very basic instrument scaffold
- validate curriculum integrity
- suggest curriculum fixes

But it still does not strongly support:
- different instrument families with different defaults
- runtime registration scaffolding
- SparkSuite module registration scaffolding
- consistent generated integration plans

That gap keeps new instruments from becoming "one command to prototype".

---

## Required Deliverables

### 1. Template system
Support generator templates at minimum:
- `fretted`
- `keys`
- `drums`

Each template should customize:
- starter skills
- starter lessons
- starter exercises
- optional tuning/chord/scale files
- lane assumptions / rhythm assumptions
- module metadata

### 2. New pipeline generator
Create a generator that supports:

```bash
node scripts/generate_instrument_pipeline.js --instrument mandolin --name Mandolin --template fretted --auto-register
```

Expected output goes into:

```text
generated/instruments/<instrumentId>/
```

### 3. Auto-registration artifacts
The generator should produce machine-readable registration guidance, not just files.

At minimum generate:
- `auto_registration.json`
- `runtime_register.generated.js`
- `sparksuite_index.generated.js`
- `integration_plan.md`

These should describe how to connect the instrument into:
- `js/sparksuite/instruments/<instrumentId>/`
- runtime registration layer under `js/instruments/`
- SparkSuite adapter registry / module index
- launcher and UI integration follow-ups

### 4. Validation compatibility
Generated output must be structurally compatible with:
- `scripts/validate_curriculum.js`
- `scripts/suggest_curriculum_fixes.js`

### 5. No fake repo assumptions
Generated docs and plans must use current repo reality:
- layered runtime
- adapter/bridge system
- SparkSuite module layer
- current engineering guardrails

---

## Design Guidance

### Template design
Templates should be data-driven, not hardcoded as giant string blobs inside the generator.

Preferred split:
- `scripts/instrument_generator_templates.js`
- `scripts/generate_instrument_pipeline.js`

### Template responsibilities
Each template should provide:
- seed skill tree entries
- seed lessons
- seed exercises
- optional extra files
- instrument metadata
- optional runtime registration stub content

### Pipeline responsibilities
The pipeline script should:
1. parse arguments
2. resolve template
3. generate scaffold files
4. generate registration artifacts
5. generate integration plan
6. print next steps

---

## Output Files (Recommended)

For a fretted instrument like mandolin:

```text
generated/instruments/mandolin/
  manifest.json
  mandolin_skill_tree.js
  mandolin_lessons.js
  mandolin_exercises.js
  mandolin_module.js
  mandolin_tuning.js
  index.js
  runtime_register.generated.js
  sparksuite_index.generated.js
  auto_registration.json
  integration_plan.md
```

For keys/drums templates, optional file set may differ.

---

## Auto-Registration Contract

`auto_registration.json` should include at least:
- `instrumentId`
- `name`
- `template`
- `generatedPaths`
- `targetPaths`
- `runtimeRegistration`
- `sparkSuiteRegistration`
- `launcherFollowUp`
- `validationCommands`

This allows future automation to consume the file directly.

---

## Practical Success Criteria

A strong implementation will let someone run one command and receive:
- a structured instrument scaffold
- a template-appropriate curriculum seed
- explicit registration guidance
- validation-compatible output
- no ambiguity about next steps

---

## Non-Goals

This pipeline does not eliminate the need for:
- musical verification
- pedagogical review
- runtime QA
- UI review

It accelerates structure and integration planning.
It does not replace design judgment.

---

## Definition of Done

This handoff is complete when:
- template system exists
- pipeline generator exists
- auto-registration artifacts are generated
- outputs are written to `generated/instruments/<id>/`
- generated scaffolds align with current repo architecture
- next steps are explicit enough for Codex/Claude/devs to continue without guesswork
