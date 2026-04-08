# Cleanup Handoff

## Goal
Consolidate the new instrument pipeline into a clean final toolchain and remove redundant intermediate scripts once the final flow is verified.

## Current State
The repo now contains multiple generations of pipeline scripts:
- `scripts/generate_instrument_scaffold.js`
- `scripts/generate_instrument_pipeline.js`
- `scripts/generate_instrument_pipeline_final.js`
- `scripts/apply_generated_instrument.js`
- `scripts/apply_generated_instrument_final.js`

This was useful during iteration, but it now creates ambiguity.

## Required Cleanup

### 1. Keep final entry points
Target final scripts:
- `scripts/generate_instrument_pipeline_final.js`
- `scripts/apply_generated_instrument_final.js`
- `scripts/validate_curriculum.js`
- `scripts/suggest_curriculum_fixes.js`
- `scripts/instrument_generator_templates.js`

### 2. Deprecate or remove older scripts
Candidates to remove or replace with wrappers:
- `scripts/generate_instrument_scaffold.js`
- `scripts/generate_instrument_pipeline.js`
- `scripts/apply_generated_instrument.js`

### 3. Add package.json aliases
Recommended aliases:
- `npm run instrument:generate`
- `npm run instrument:validate`
- `npm run instrument:fixes`
- `npm run instrument:apply`

### 4. Update docs
Docs should point to final scripts only.

### 5. Preserve behavior
Cleanup must not remove:
- manifest auto-update
- validator gating
- CI guardrails
- generated reports

## Definition of Done
- one clearly documented generate script
- one clearly documented apply script
- no ambiguity about which scripts are current
- docs and examples updated to final names
