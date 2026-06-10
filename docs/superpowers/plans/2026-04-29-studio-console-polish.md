# Studio Console Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the SparkSuite launcher into the approved Studio Console direction.

**Architecture:** Keep the current vanilla HTML-string renderer and Showroom CSS layer. Update launcher markup only where additional semantic hooks improve styling, and keep existing app actions intact.

**Tech Stack:** Vanilla JavaScript, HTML string rendering, CSS, Electron/web entry via `index.html`.

---

### Task 1: Launcher Markup Hooks

**Files:**
- Modify: `js/launcher.js`

- [ ] Add small semantic wrappers/classes to the topbar, hero, instrument cards, stats, and quick launch button.
- [ ] Preserve every existing `act(...)` action and keyboard handler.
- [ ] Use existing Material Symbols rather than adding new icon systems.

### Task 2: Studio Console Styling

**Files:**
- Modify: `spark-showroom.css`

- [ ] Refine the base Showroom launcher surface, woodgrain, glass panels, topbar, hero, cards, stats, FAB, and bottom nav.
- [ ] Keep selectors scoped to `.showroom-*`.
- [ ] Maintain responsive mobile-first layout and reduced-motion support.

### Task 3: Verification

**Files:**
- No source changes expected.

- [ ] Run `npm run lint`.
- [ ] Start the app with `npm start`.
- [ ] Inspect the launcher visually in the in-app browser or local app window.
