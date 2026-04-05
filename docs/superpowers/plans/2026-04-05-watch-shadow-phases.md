# Watch & Shadow Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the static Watch and Shadow NewMove phases with an animated step-by-step finger breakdown (Watch) and an interactive finger placement quiz (Shadow) for all instruments.

**Architecture:** A shared watch_common.js provides stringed-instrument Watch/Shadow logic plus animation utilities. Piano gets its own watch.js. Each instrument register.js wires watchAnimation and shadowQuiz methods. guided.js delegates to these methods instead of rendering static HTML.

**Tech Stack:** Vanilla JS, SVG (reusing existing renderers), CSS animations, existing audio system

---

## Task 1: Shared Watch/Shadow utilities

**Files:** Create js/core/watch_common.js

## Task 2: Piano Watch/Shadow

**Files:** Create js/instruments/piano/watch.js

## Task 3: Wire into instrument register files

**Files:** Modify all 4 register.js files

## Task 4: Update guided.js

**Files:** Modify js/pages/guided.js

## Task 5: Add script tags to index.html

**Files:** Modify index.html

## Task 6: Manual smoke test

See full plan in conversation context.
