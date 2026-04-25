# SparkSuite Regression Checklist

## Golden Paths
- [ ] Guitar happy path passes.
- [ ] Ukulele modularity path passes.
- [ ] Save migration fixture path passes.
- [ ] Structured recovery path shows recovery actions and can export a debug bundle.

## Fixtures
- [ ] Session fixtures validate as canonical `SessionPlan` payloads.
- [ ] Result fixtures preserve deterministic hit/miss/timing totals.
- [ ] Save fixtures migrate to the current schema.
- [ ] Invalid content fixtures fail validation.

## Runtime and Recovery
- [ ] Timing windows still score correctly.
- [ ] Input lane mapping still matches the active instrument.
- [ ] Debug bundle includes session summary, errors, missing handlers, and budget warnings.
- [ ] Import/export round-trip preserves settings and practice journal data.

## Scope Guard
- [ ] No social features added.
- [ ] No leaderboard features added.
- [ ] No store or marketplace features added.
