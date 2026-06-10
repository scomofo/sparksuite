# Curriculum V2 Rollout

## What landed

SparkSuite now has a canonical Phase 1 curriculum dataset under `curriculum/v2/`.
This dataset captures the 30-day ADHD-first track outlines for:

- guitar
- bass
- piano
- ukulele

Each instrument ships with:

- `tracks/<instrument>-30day.json`: ordered session shells
- `activities/<instrument>-30day.activities.json`: block-level activity records
- `catalog.json`: top-level manifest and design principles

## Why this exists

The repo currently has multiple curriculum shapes in active use:

- legacy flat level arrays for guitar, piano, and bass
- skill-first ukulele lessons
- older registry-based curriculum objects

That makes curriculum changes easy to discuss but hard to validate. The new `curriculum/v2/` tree gives us a stable source of truth for the rebuild without forcing an immediate runtime migration.

## Current assumptions

- The existing runtime remains intact for now.
- `curriculum/v2/` is a canonical data layer, not yet the live app datasource.
- Session shells are normalized to 4 blocks:
  `warm_engine`, `drill`, `song`, `cooldown`
- `novelty_count` is enforced as data, with a hard cap of `1`.
- Showcase days use `record_save` as their completion type.

## Validation

`tests/test_curriculum_v2_data.js` now verifies:

- all four instrument files exist
- each track has 30 ordered sessions
- every session uses the 4-block shell
- `novelty_count <= 1`
- session block `activity_id`s resolve to generated activity data

## Recommended next step

Bridge one runtime surface to this new dataset first, rather than migrating every instrument at once.
The cleanest Phase 1 path is still guitar-first: load `curriculum/v2/tracks/guitar-30day.json` into the session shell and keep the rest of the app on legacy data until the shell is proven.
