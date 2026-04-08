# Instrument Generator Pipeline

## Overview

Automates creation and integration of new SparkSuite instruments.
Ensures every instrument has all required layers, passes validation,
and is discoverable at runtime via manifest.

## Pipeline Stages

    1. Template Selection:  node scripts/instrument_generator_templates.js --list
    2. Scaffold Generation: node scripts/generate_instrument_pipeline.js <name> --type <template>
    3. Validation:          node scripts/validate_curriculum.js
    4. Fix Suggestions:     node scripts/suggest_curriculum_fixes.js
    5. Manifest + Integration: node scripts/apply_generated_instrument.js
    6. CI Guardrails:       .github/workflows/curriculum-guardrails.yml
    7. Runtime Discovery:   js/instruments/discovery_loader.js reads manifest

## File Map

### Scripts

| Script | Purpose |
|--------|---------|
| generate_instrument_pipeline.js | Scaffolds all files for a new instrument |
| instrument_generator_templates.js | Lists available instrument templates |
| validate_curriculum.js | Runs curriculum contract validation |
| suggest_curriculum_fixes.js | Suggests fixes for curriculum issues |
| apply_generated_instrument.js | Rebuilds manifest and integrates instrument |

### Runtime

| File | Purpose |
|------|---------|
| js/instruments/instrument_manifest.generated.js | Auto-generated manifest |
| js/instruments/discovery_loader.js | Reads manifest, injects scripts |

### CI

| File | Purpose |
|------|---------|
| .github/workflows/curriculum-guardrails.yml | Validates curriculum on PR |
| tests/test_curriculum_guardrails.js | Curriculum contract test suite |

## Adding a New Instrument

1. Choose template: node scripts/instrument_generator_templates.js --list
2. Generate: node scripts/generate_instrument_pipeline.js banjo --type stringed --strings 5
3. Add real data to generated stubs
4. Validate: node scripts/validate_curriculum.js
5. Fix issues: node scripts/suggest_curriculum_fixes.js
6. Integrate: node scripts/apply_generated_instrument.js
7. Test: npm test
8. Verify in app: npm start

## Constraints

- Browsers cannot scan directories. Discovery must be manifest-driven.
- Script load order matters. Module files load before register.js.
- Generated manifest should not be hand-edited.
- All instruments must pass curriculum guardrails before merge.

## Related Docs

- docs/engineering/CURRICULUM_CONTRACT.md
- docs/engineering/INSTRUMENT_DEBUG_GUIDE.md
- docs/engineering/instrument-module-contract.md
- docs/engineering/handoffs/INSTRUMENT_GENERATOR_PIPELINE_HANDOFF.md
- docs/engineering/handoffs/AUTO_INTEGRATION_HANDOFF.md
- docs/engineering/handoffs/MANIFEST_AUTO_UPDATE_HANDOFF.md
