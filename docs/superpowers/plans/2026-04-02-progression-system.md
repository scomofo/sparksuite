# SparkSuite Progression System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a unified progression orchestrator that automatically evaluates XP, levels, mastery, unlocks, achievements, streaks, and goals whenever a session completes — replacing the current scattered manual calls.

**Architecture:** `SparkProgressOrchestrator` wraps existing modules (`js/meta/xp.js`, `js/meta/levels.js`, `js/meta/achievements.js`, `js/progression/mastery.js`, `js/progression/unlocks.js`, `js/meta/weekly_goals.js`) into a single `evaluateAll()` call. This gets hooked into `SparkSession.processResults()` so the full progression cascade happens automatically. No rewriting of existing modules — just a coordinator on top.

**Tech Stack:** Vanilla JavaScript (ES5, IIFEs, window globals)

---

## File Structure

| File | Responsibility | Status |
|------|---------------|--------|
| `js/spark-core/progress-orchestrator.js` | Unified progression evaluator | **Create** |
| `js/spark-core/session-engine.js` | Hook orchestrator into processResults | Modify |
| `js/spark-core/index.js` | Register orchestrator | Modify |
| `index.html` | Add script tag | Modify |

---

### Task 1: Create ProgressOrchestrator

**Files:**
- Create: `js/spark-core/progress-orchestrator.js`

- [ ] **Step 1: Create the ProgressOrchestrator IIFE**

```javascript
// js/spark-core/progress-orchestrator.js
// Unified progression cascade: evaluates all progression systems after any session event.
// Wraps existing modules (xp.js, levels.js, achievements.js, mastery.js, unlocks.js, weekly_goals.js).
(function() {

  var SparkProgressOrchestrator = {

    /**
     * Run the full progression cascade after a session completes.
     * Call this once — it evaluates everything in the correct order.
     * @param {object} event - { type, chordName, accuracy, xpAwarded, duration, songId }
     * @returns {object} result - { xpTotal, leveledUp, newLevel, newAchievements, newUnlocks, goalsCompleted, masteryUpdates }
     */
    evaluateAll: function(event) {
      event = event || {};
      var result = {
        xpTotal: 0,
        leveledUp: false,
        newLevel: S.playerLevel || 1,
        newAchievements: [],
        newUnlocks: [],
        goalsCompleted: [],
        masteryUpdates: {}
      };

      // 1. Award XP (uses existing meta/xp.js if available)
      if (event.xpAwarded && typeof awardXP === "function") {
        awardXP(event.xpAwarded, event.type || "session");
        result.xpTotal += event.xpAwarded;
      }

      // 2. Practice time XP (uses existing meta/xp.js)
      if (event.duration && typeof awardPracticeXP === "function") {
        var practiceMinutes = event.duration / 60;
        awardPracticeXP(practiceMinutes);
        result.xpTotal += Math.round(practiceMinutes * 2);
      }

      // 3. Song XP (uses existing meta/xp.js)
      if (event.type === "song" && event.accuracy && typeof awardSongXP === "function") {
        awardSongXP(event.accuracy);
        result.xpTotal += 20 + Math.round((event.accuracy || 0) * 20);
      }

      // 4. Check level up (uses existing meta/levels.js)
      var prevLevel = S.playerLevel || 1;
      if (typeof checkLevelUp === "function") {
        checkLevelUp();
      }
      if ((S.playerLevel || 1) > prevLevel) {
        result.leveledUp = true;
        result.newLevel = S.playerLevel;
      }

      // 5. Update mastery (uses existing progression/mastery.js)
      if (event.chordName && typeof updateMastery === "function") {
        var acc = event.accuracy || 0.75;
        updateMastery("chords", event.chordName, acc * 100);
        result.masteryUpdates[event.chordName] = S.mastery && S.mastery.chords ? S.mastery.chords[event.chordName] : 0;
      }
      if (event.type === "song" && event.songId && typeof updateMastery === "function") {
        updateMastery("songs", event.songId, (event.accuracy || 0) * 100);
      }

      // 6. Evaluate unlocks (uses existing progression/unlocks.js)
      if (typeof evaluateUnlocks === "function") {
        var prevUnlocks = JSON.stringify(S.unlocks || {});
        evaluateUnlocks();
        var newUnlocks = JSON.stringify(S.unlocks || {});
        if (newUnlocks !== prevUnlocks) {
          result.newUnlocks.push("content_unlocked");
        }
      }

      // 7. Evaluate achievements (uses existing meta/achievements.js)
      if (typeof evaluateAchievements === "function") {
        var prevAch = Object.keys(S.playerAchievements || {}).length;
        evaluateAchievements();
        var newAch = Object.keys(S.playerAchievements || {}).length;
        if (newAch > prevAch) {
          result.newAchievements.push("achievement_earned");
        }
      }

      // 8. Evaluate suite-level achievements (uses spark-core/achievements.js)
      if (typeof SparkAchievements !== "undefined" && typeof SparkStorage !== "undefined") {
        var profile = SparkStorage.load();
        if (profile) {
          var earned = SparkAchievements.evaluate(profile);
          if (earned.length > 0) {
            SparkAchievements.applyEarned(profile, earned);
            SparkStorage.save(profile);
            result.newAchievements = result.newAchievements.concat(earned);
          }
        }
      }

      // 9. Update weekly goals (uses existing meta/weekly_goals.js)
      if (typeof updateWeeklyGoal === "function") {
        if (event.type === "session" || event.type === "drill") {
          updateWeeklyGoal("practice_minutes", (event.duration || 120) / 60);
          updateWeeklyGoal("practice_days", 1);
        }
        if (event.type === "song") {
          updateWeeklyGoal("songs_completed", 1);
        }
      }

      // 10. Update challenge progress (uses existing meta/challenge_engine.js)
      if (typeof updateChallengeProgressByType === "function") {
        if (event.type === "session") updateChallengeProgressByType("sessions", 1);
        if (event.type === "drill") updateChallengeProgressByType("drills", 1);
        if (event.type === "song") updateChallengeProgressByType("songs", 1);
        if (event.chordName) updateChallengeProgressByType("chords_practiced", 1);
      }

      // 11. Streak XP bonus (uses existing meta/xp.js)
      if (event.streakUpdated && S.streak && typeof awardStreakXP === "function") {
        if (S.streak % 7 === 0) {
          awardStreakXP(S.streak);
          result.xpTotal += S.streak * 5;
        }
      }

      // 12. Comeback bonus (uses SparkPsychology)
      if (typeof SparkPsychology !== "undefined" && event.type === "session") {
        var comebackXP = SparkPsychology.getComebackBonus(S.lastSessionDate);
        if (comebackXP > 0 && typeof awardXP === "function") {
          awardXP(comebackXP, "comeback");
          result.xpTotal += comebackXP;
        }
      }

      return result;
    }
  };

  window.SparkProgressOrchestrator = SparkProgressOrchestrator;
})();
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/progress-orchestrator.js
git commit -m "feat(core): create SparkProgressOrchestrator unified progression cascade"
```

---

### Task 2: Hook Orchestrator into SparkSession.processResults

**Files:**
- Modify: `js/spark-core/session-engine.js`

- [ ] **Step 1: Add orchestrator call at the end of processResults**

In `js/spark-core/session-engine.js`, find the `processResults` method. After the existing badge check (step 8) and before the final `return outcome`, add:

```javascript
      // 10. Run full progression cascade
      if (typeof SparkProgressOrchestrator !== "undefined") {
        var progressResult = SparkProgressOrchestrator.evaluateAll({
          type: results.type || "session",
          chordName: results.chordName,
          accuracy: results.accuracy,
          xpAwarded: outcome.xpEarned,
          duration: results.duration,
          songId: results.songId,
          streakUpdated: outcome.streakUpdated
        });
        // Merge progression results into outcome
        if (progressResult.leveledUp) {
          outcome.playerLeveledUp = true;
          outcome.newPlayerLevel = progressResult.newLevel;
        }
        if (progressResult.newAchievements.length) {
          outcome.newAchievements = progressResult.newAchievements;
        }
      }
```

- [ ] **Step 2: Commit**

```bash
git add js/spark-core/session-engine.js
git commit -m "feat(core): hook SparkProgressOrchestrator into SparkSession.processResults"
```

---

### Task 3: Register Orchestrator and Add Script Tag

**Files:**
- Modify: `js/spark-core/index.js`
- Modify: `index.html`

- [ ] **Step 1: Add to SparkCore barrel**

In `js/spark-core/index.js`, add after the `InstrumentAdapter` line:

```javascript
    ProgressOrchestrator: window.SparkProgressOrchestrator,
```

- [ ] **Step 2: Add script tag to index.html**

Find the spark-core script block. Add the new script BEFORE `session-engine.js` (since session-engine calls the orchestrator):

```html
<script src="js/spark-core/progress-orchestrator.js"></script>
```

Add it after `psychology-engine.js` and before `instrument-adapter.js`.

- [ ] **Step 3: Commit**

```bash
git add js/spark-core/index.js index.html
git commit -m "feat(core): register ProgressOrchestrator in barrel and add script tag"
```

---

### Task 4: Initialize Missing State Fields

**Files:**
- Modify: `js/state.js` (ensure progression fields exist in PERSIST_FIELDS)

- [ ] **Step 1: Check and add missing progression state fields**

In `js/state.js`, find the PERSIST_FIELDS array. Ensure these fields are present (add any that are missing):

```javascript
// Progression system fields
"playerXP","playerLevel","playerAchievements","playerStats",
"xpLog","mastery","unlocks","weeklyGoals","metaProgress",
"progressionTree","adaptiveDecisions","adaptiveLastDecision",
"activeChallenges","seasonalEvents","activeEventId","challengeRewards",
```

Also ensure the state initialization (in the `S = {}` definition or loadState) sets defaults:

```javascript
if (S.playerXP === undefined) S.playerXP = 0;
if (S.playerLevel === undefined) S.playerLevel = 1;
if (S.playerAchievements === undefined) S.playerAchievements = {};
if (S.playerStats === undefined) S.playerStats = { songsCompleted: 0, totalPracticeMinutes: 0 };
if (S.mastery === undefined) S.mastery = {};
if (S.unlocks === undefined) S.unlocks = {};
if (S.weeklyGoals === undefined) S.weeklyGoals = [];
if (S.metaProgress === undefined) S.metaProgress = { goalsCompleted: 0 };
if (S.practiceStreak === undefined) S.practiceStreak = 0;
```

- [ ] **Step 2: Commit**

```bash
git add js/state.js
git commit -m "feat(core): ensure progression state fields are persisted and initialized"
```

---

### Task 5: Verify End-to-End Progression

**Files:** None (verification only)

- [ ] **Step 1: Test session completion triggers progression**

1. Open browser, select Guitar
2. Start a session (Quick Start)
3. Open browser console (F12)
4. Complete session (click Done or wait)
5. In console, check: `S.playerXP` (should be > 0), `S.playerLevel` (should be 1+), `S.mastery` (should have chord entries)

- [ ] **Step 2: Test that existing features still work**

1. Navigate to other tabs (drill, songs, games) — no errors
2. Switch to Piano — no errors
3. Reload page — state persists

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve issues found during progression verification"
```

---

## What This Plan Does NOT Cover (Plan 3+)

- **Plan 3 (Instrument Module Conversion):** Guitar/Piano implement InstrumentModule interface (getSkillTree, getCurriculumMap, etc.)
- **Plan 4 (Bass Module):** New instrument with timing-first curriculum
- **Goal system UI** — Weekly goals display, challenge hub display (exists but not wired to orchestrator output)
- **Skill tree UI** — Already exists in `js/progression/skill_tree.js`, renders via `skillTreePage()`
- **Seasonal events** — Framework exists in `js/meta/events.js`, needs content
