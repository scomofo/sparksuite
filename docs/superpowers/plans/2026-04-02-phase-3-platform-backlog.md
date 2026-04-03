# SparkSuite Phase 3 Backlog

Updated: 2026-04-02

## Purpose

This document defines `Phase 3` for SparkSuite: platform maturity after architectural convergence.

Phase 3 is about making SparkSuite a durable product platform, not just a successful migration.

## Phase 3 Definition

Phase 3 is complete when:

- most remaining legacy pathways are removed or clearly quarantined
- content, import, analytics, and editor systems fit the converged architecture
- new instruments and authored content can be added with minimal engine changes
- the platform is easier to extend than the original shell-based app

## Primary Goals

### 1. Retire Legacy Shell Dependencies

Goal:
- remove or quarantine the remaining old pathways after Phase 2 convergence

Required work:
- replace remaining `act(...)`-centric orchestration where it still matters
- reduce direct `S.*` reliance to true compatibility or persistence projection only
- deprecate legacy branches that are no longer needed

### 2. Unify Authoring and Import Pipelines

Goal:
- make imported charts, authored charts, editor outputs, and curriculum content fit one platform model

Required work:
- align editor output with import/runtime schemas
- reduce one-off conversion layers
- make authored content and imported content easier to reuse across instruments

### 3. Deepen Analytics and Recommendation Systems

Goal:
- turn the converged architecture into better learning/product behavior

Required work:
- feed richer gameplay results into recommendations, weak spots, mastery, and curriculum selection
- expand technique-aware analytics across imported/authored content
- improve cross-instrument and cross-mode insight surfaces

### 4. Expand Instrument Extensibility

Goal:
- make instrument addition mostly module- and data-driven

Required work:
- reduce remaining special cases for instrument runtime behavior
- expand content/module templates
- document the minimum contract for adding new instruments cleanly

## Suggested Order

1. Retire remaining legacy shell dependencies
2. Unify authoring/import/editor pipelines
3. Deepen analytics/recommendation systems
4. Improve instrument extensibility and platform docs

## Honest Exit Criteria

We can call Phase 3 done when:

- SparkSuite feels like a coherent platform rather than a migrated shell
- adding instruments/content rarely requires core rewiring
- long-term maintenance is clearly easier than before the migration
