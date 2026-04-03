# Guitar & Piano Module Conversion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend guitar and piano instrument registrations with the formal InstrumentModule interface (`getSkillTree`, `getCurriculumMap`, `getExercises`, `getSongs`, `getDifficultyRules`, `analyzePerformance`, `generateDrills`) so SparkCore engines can query any instrument uniformly — enabling Bass and future instruments to plug in with the same shape.

**Architecture:** Add methods to existing `SparkInstruments.register()` configs. Guitar wraps existing globals (`CURRICULUM`, `FINGER_EXERCISES`, `buildSkillTree`, `buildAdaptiveDecision`). Piano wraps `PIANO_DATA` equivalents. No new files needed for guitar; piano gets a small module helper file. The SparkInstrumentAdapter is updated to expose the new methods.

**Tech Stack:** Vanilla JavaScript (ES5, IIFEs, window globals)

---

## File Structure

| File | Responsibility | Status |
|------|---------------|--------|
| `js/instruments/guitar/register.js` | Add module interface methods | Modify |
| `js/instruments/piano/register.js` | Add module interface methods | Modify |
| `js/spark-core/instrument-adapter.js` | Expose new methods from active instrument | Modify |

---

### Task 1: Add Module Interface to Guitar Registration

**Files:**
- Modify: `js/instruments/guitar/register.js`

- [ ] **Step 1: Add the 6 module interface methods to guitar registration**

In `js/instruments/guitar/register.js`, add these methods to the registration object (after `init`):

```javascript
    // ── InstrumentModule interface ──

    getSkillTree: function() {
      if (typeof buildSkillTree === "function") return buildSkillTree();
      return { branches: [] };
    },

    getCurriculumMap: function() {
      return typeof CURRICULUM !== "undefined" ? CURRICULUM : [];
    },

    getExercises: function() {
      return typeof FINGER_EXERCISES !== "undefined" ? FINGER_EXERCISES : [];
    },

    getSongs: function() {
      return typeof SONGS !== "undefined" ? SONGS : [];
    },

    getDifficultyRules: function(context) {
      if (typeof buildAdaptiveDecision === "function") return buildAdaptiveDecision(context);
      return { targetType: "generic", difficultyAction: "keep", currentValue: 0, nextValue: 0, reason: "No adaptive engine" };
    },

    analyzePerformance: function(sessionData) {
      if (typeof finalizePerformanceResults === "function" && sessionData.chart && sessionData.phraseStats) {
        return finalizePerformanceResults(sessionData.chart, sessionData.phraseStats);
      }
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill, level) {
      var D = this.getData();
      var chords = D.CHORDS[level] || D.CHORDS[1] || [];
      if (skill === "chord" && chords.length > 0) {
        return [chords[Math.floor(Math.random() * chords.length)]];
      }
      if (skill === "transition" && chords.length >= 2) {
        var c1 = chords[Math.floor(Math.random() * chords.length)];
        var c2 = chords[Math.floor(Math.random() * chords.length)];
        return [c1, c2];
      }
      return chords.slice(0, 2);
    }
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/guitar/register.js
git commit -m "feat(guitar): add InstrumentModule interface methods to registration"
```

---

### Task 2: Add Module Interface to Piano Registration

**Files:**
- Modify: `js/instruments/piano/register.js`

- [ ] **Step 1: Add the 6 module interface methods to piano registration**

In `js/instruments/piano/register.js`, add these methods after `init` (before the closing `});`):

```javascript
    // ── InstrumentModule interface ──

    getSkillTree: function() {
      var D = this.getData();
      var curriculum = D.CURRICULUM || [];
      var branches = [];
      for (var i = 0; i < curriculum.length; i++) {
        var lvl = curriculum[i];
        branches.push({
          id: "level_" + lvl.num,
          label: lvl.title,
          level: lvl.num,
          status: (S.level || 1) >= lvl.num ? "available" : "locked",
          progress: (S.level || 1) > lvl.num ? 100 : ((S.level || 1) === lvl.num ? 50 : 0)
        });
      }
      return { branches: branches };
    },

    getCurriculumMap: function() {
      var D = this.getData();
      return D.CURRICULUM || [];
    },

    getExercises: function() {
      var D = this.getData();
      return D.FINGER_EXERCISES || [];
    },

    getSongs: function() {
      var D = this.getData();
      return D.SONGS || [];
    },

    getDifficultyRules: function(context) {
      if (typeof buildAdaptiveDecision === "function") return buildAdaptiveDecision(context);
      return { targetType: "generic", difficultyAction: "keep", currentValue: 0, nextValue: 0, reason: "No adaptive engine" };
    },

    analyzePerformance: function(sessionData) {
      if (typeof finalizePerformanceResults === "function" && sessionData.chart && sessionData.phraseStats) {
        return finalizePerformanceResults(sessionData.chart, sessionData.phraseStats);
      }
      return { accuracy: 0, avgScore: 0, stars: 0 };
    },

    generateDrills: function(skill, level) {
      var D = this.getData();
      if (typeof chordsForLevel === "function") {
        var chords = chordsForLevel(level);
        if (chords.length > 0) return chords.slice(0, 2);
      }
      return [];
    }
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/piano/register.js
git commit -m "feat(piano): add InstrumentModule interface methods to registration"
```

---

### Task 3: Update InstrumentAdapter to Expose Module Methods

**Files:**
- Modify: `js/spark-core/instrument-adapter.js`

- [ ] **Step 1: Add proxy methods for the module interface**

In `js/spark-core/instrument-adapter.js`, add these methods to the `SparkInstrumentAdapter` object:

```javascript
    /**
     * Get skill tree from active instrument.
     * @returns {object} { branches: [] }
     */
    getSkillTree: function() {
      var inst = SparkInstruments.getActive();
      return (inst && inst.getSkillTree) ? inst.getSkillTree() : { branches: [] };
    },

    /**
     * Get curriculum map from active instrument.
     * @returns {Array}
     */
    getCurriculumMap: function() {
      var inst = SparkInstruments.getActive();
      return (inst && inst.getCurriculumMap) ? inst.getCurriculumMap() : [];
    },

    /**
     * Get exercises from active instrument.
     * @returns {Array}
     */
    getExercises: function() {
      var inst = SparkInstruments.getActive();
      return (inst && inst.getExercises) ? inst.getExercises() : [];
    },

    /**
     * Get songs from active instrument.
     * @returns {Array}
     */
    getSongs: function() {
      var inst = SparkInstruments.getActive();
      return (inst && inst.getSongs) ? inst.getSongs() : [];
    },

    /**
     * Get difficulty adjustment decision.
     * @param {object} context
     * @returns {object}
     */
    getDifficultyRules: function(context) {
      var inst = SparkInstruments.getActive();
      return (inst && inst.getDifficultyRules) ? inst.getDifficultyRules(context) : { difficultyAction: "keep" };
    },

    /**
     * Analyze performance data.
     * @param {object} sessionData
     * @returns {object}
     */
    analyzePerformance: function(sessionData) {
      var inst = SparkInstruments.getActive();
      return (inst && inst.analyzePerformance) ? inst.analyzePerformance(sessionData) : { accuracy: 0 };
    },

    /**
     * Generate drills for a skill at a level.
     * @param {string} skill
     * @param {number} level
     * @returns {Array}
     */
    generateDrills: function(skill, level) {
      var inst = SparkInstruments.getActive();
      return (inst && inst.generateDrills) ? inst.generateDrills(skill, level) : [];
    }
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/instrument-adapter.js
git commit -m "feat(core): expose InstrumentModule methods via SparkInstrumentAdapter"
```

---

### Task 4: Verify Module Interface

**Files:** None (verification)

- [ ] **Step 1: Test guitar module methods in console**

Open browser, select Guitar, then in console:
```javascript
var inst = SparkInstruments.getActive();
console.log("getSkillTree:", inst.getSkillTree());
console.log("getCurriculumMap:", inst.getCurriculumMap());
console.log("getExercises:", inst.getExercises());
console.log("getSongs:", inst.getSongs());
console.log("generateDrills:", inst.generateDrills("chord", 1));
```

All should return non-empty results.

- [ ] **Step 2: Test piano module methods in console**

Switch to Piano, then:
```javascript
var inst = SparkInstruments.getActive();
console.log("getSkillTree:", inst.getSkillTree());
console.log("getCurriculumMap:", inst.getCurriculumMap());
console.log("getSongs:", inst.getSongs());
console.log("generateDrills:", inst.generateDrills("chord", 1));
```

- [ ] **Step 3: Test adapter passthrough**

```javascript
console.log("Adapter skillTree:", SparkInstrumentAdapter.getSkillTree());
console.log("Adapter curriculum:", SparkInstrumentAdapter.getCurriculumMap());
console.log("Adapter type:", SparkInstrumentAdapter.getInstrumentType());
```

- [ ] **Step 4: Push**

```bash
git push
```
