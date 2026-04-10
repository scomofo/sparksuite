# Instrument Generator Pipeline

## Purpose

This pipeline exists to make new instrument creation structured, repeatable, and guardrailed.

Instead of adding a new instrument by hand across many files, the goal is to:

1. generate a valid scaffold
2. fill in instrument-specific content
3. run curriculum validation
4. fix gaps before merge

---

## Workflow

```bash
node scripts/generate_instrument_scaffold.js --instrument mandolin --name Mandolin
node scripts/validate_curriculum.js
node scripts/suggest_curriculum_fixes.js
```

---

## Output Location

Generated scaffolds are placed in:

```
generated/instruments/<instrumentId>/
```

---

## Final Rule

Generator accelerates structure, not correctness.

Validation remains mandatory.
