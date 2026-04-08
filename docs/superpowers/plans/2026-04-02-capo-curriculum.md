# Capo Curriculum Branch — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add capo as a first-class guitar curriculum branch with transposition helpers, 8 lessons, 7 exercise types, skill tree nodes, and game drills — all wired through the SparkCore engines.

**Architecture:** Capo data and transposition logic live in a new `js/instruments/guitar/capo.js`. Capo skills are added to guitar's skill tree and curriculum. Exercise generation uses the transposition algorithm. The UI renders capo exercises through existing shared pages — no new pages needed, just new exercise types that the practice tab can display.

**Tech Stack:** Vanilla JavaScript (ES5, IIFEs, window globals)

---

## File Structure

| File | Responsibility | Status |
|------|---------------|--------|
| `js/instruments/guitar/capo.js` | Transposition helpers, capo data, exercise generators | **Create** |
| `js/instruments/guitar/register.js` | Expose capo data via getData(), add capo skills to skill tree | Modify |
| `js/data.js` | Add capo lessons to GUITAR_SESSIONS | Modify |
| `index.html` | Add capo.js script tag | Modify |

---

### Task 1: Create Capo Module with Transposition Helpers and Data

**Files:**
- Create: `js/instruments/guitar/capo.js`

- [ ] **Step 1: Create the capo module IIFE**

```javascript
// js/instruments/guitar/capo.js
// Capo transposition helpers, skill tree, lesson data, exercise generators
(function() {

// ── Pitch class mapping ──
var NOTE_TO_PC = {
  "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
  "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
};
var PC_TO_NAME = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

/**
 * Transpose a note root by semitones.
 * @param {string} root - e.g. "G", "C#"
 * @param {number} semitones - capo fret (0-12)
 * @returns {string} sounding note name
 */
function transposeRoot(root, semitones) {
  var pc = NOTE_TO_PC[root];
  if (pc === undefined) return root;
  return PC_TO_NAME[(pc + semitones + 12) % 12];
}

/**
 * Get the sounding chord from a shape + capo position.
 * Preserves quality (Major, Minor, 7, etc.)
 * @param {string} shapeChord - e.g. "G Major", "Am", "D7"
 * @param {number} capoFret
 * @returns {object} { shape, sounding, capo, quality }
 */
function soundingChord(shapeChord, capoFret) {
  // Parse root from chord name
  var root, quality;
  var match = shapeChord.match(/^([A-G][#b]?)\s*(.*)/);
  if (match) {
    root = match[1];
    quality = match[2] || "Major";
  } else {
    root = shapeChord;
    quality = "Major";
  }
  var soundingRoot = transposeRoot(root, capoFret);
  return {
    shape: shapeChord,
    sounding: soundingRoot + (quality ? " " + quality : ""),
    soundingRoot: soundingRoot,
    capo: capoFret,
    quality: quality
  };
}

/**
 * Get the sounding key for a shape key root + capo.
 * @param {string} shapeKeyRoot - e.g. "G"
 * @param {number} capoFret
 * @returns {string} sounding key root
 */
function soundingKey(shapeKeyRoot, capoFret) {
  return transposeRoot(shapeKeyRoot, capoFret);
}

/**
 * Find valid capo positions + shape families to play in a target key.
 * @param {string} targetKey - e.g. "Bb"
 * @param {string[]} shapeFamilies - e.g. ["G", "C", "D", "A", "E"]
 * @returns {Array} [{ capoFret, shapeRoot, targetKey }]
 */
function findCapoSolutions(targetKey, shapeFamilies) {
  shapeFamilies = shapeFamilies || ["G", "C", "D", "A", "E"];
  var targetPC = NOTE_TO_PC[targetKey];
  if (targetPC === undefined) return [];
  var solutions = [];
  for (var i = 0; i < shapeFamilies.length; i++) {
    var shapePC = NOTE_TO_PC[shapeFamilies[i]];
    if (shapePC === undefined) continue;
    var capo = (targetPC - shapePC + 12) % 12;
    if (capo <= 9) { // practical capo range
      solutions.push({
        capoFret: capo,
        shapeRoot: shapeFamilies[i],
        targetKey: targetKey
      });
    }
  }
  // Sort by capo fret (lower = easier)
  solutions.sort(function(a, b) { return a.capoFret - b.capoFret; });
  return solutions;
}

// ── Shape-to-Key reference chart (capo 0-5, common shapes) ──
var CAPO_CHART = {};
var SHAPE_FAMILIES = ["G", "C", "D", "A", "E"];
for (var fret = 0; fret <= 7; fret++) {
  CAPO_CHART[fret] = {};
  for (var s = 0; s < SHAPE_FAMILIES.length; s++) {
    CAPO_CHART[fret][SHAPE_FAMILIES[s]] = transposeRoot(SHAPE_FAMILIES[s], fret);
  }
}

// ── Capo Skill Tree Nodes ──
var CAPO_SKILLS = [
  { id: "capo_basics", name: "Capo Basics", category: "capo",
    prereqs: ["open_chords"], desc: "What a capo does — movable nut concept" },
  { id: "capo_keys", name: "Capo Key Mapping", category: "capo",
    prereqs: ["capo_basics"], desc: "Map shapes to actual keys across capo positions" },
  { id: "capo_song_playing", name: "Songs With Capo", category: "capo",
    prereqs: ["capo_keys"], desc: "Use capo to play songs in new keys with easy shapes" },
  { id: "capo_transposition", name: "Capo Transposition", category: "capo",
    prereqs: ["capo_keys"], desc: "Choose capo + shape family to match a target key" },
  { id: "capo_singer_mode", name: "Singer Range Matching", category: "capo",
    prereqs: ["capo_transposition"], desc: "Adjust capo to support vocal range changes" },
  { id: "capo_multi_position", name: "Multiple Position Strategy", category: "capo",
    prereqs: ["capo_transposition"], desc: "Compare capo solutions and choose the easiest" }
];

// ── Capo Lessons (8 lessons) ──
var CAPO_LESSONS = [
  { id: "capo_L1", title: "What a Capo Does", skill: "capo_basics", level: 4,
    objective: "Capo placement, fret numbering, movable nut concept.",
    exercises: ["capo_place"],
    spark: "Place the capo on fret 2. Play G, C, D — hear how they sound higher but feel the same." },
  { id: "capo_L2", title: "Shapes vs. Actual Chords", skill: "capo_basics", level: 4,
    objective: "Separate visual hand shape from sounding chord name.",
    exercises: ["shape_to_key"],
    spark: "G shape + capo 2 = A. The shape didn't change, but the music did!" },
  { id: "capo_L3", title: "The Capo Key Chart", skill: "capo_keys", level: 4,
    objective: "Use the chart to identify sounding keys rapidly.",
    exercises: ["shape_to_key"],
    spark: "By fret 5, your G shape sounds like C. Every fret shifts one semitone." },
  { id: "capo_L4", title: "Progressions With Capo", skill: "capo_keys", level: 5,
    objective: "Apply capo concept to common progressions.",
    exercises: ["progression_label"],
    spark: "G-D-Em-C with capo 2 is actually A-E-F#m-D. Same shapes, different key!" },
  { id: "capo_L5", title: "Songs With Capo", skill: "capo_song_playing", level: 5,
    objective: "Use capo to make songs playable with easy shapes.",
    exercises: ["song_with_capo"],
    spark: "Some of the biggest hits use a capo. Let's play one right now." },
  { id: "capo_L6", title: "Key-to-Capo Problem Solving", skill: "capo_transposition", level: 5,
    objective: "Given a target key, choose capo position and shape family.",
    exercises: ["key_to_capo"],
    spark: "Need to play in Bb? Capo 3 + G shapes. Easy!" },
  { id: "capo_L7", title: "Singer Mode", skill: "capo_singer_mode", level: 6,
    objective: "Adjust capo to support vocal range without relearning chords.",
    exercises: ["singer_shift"],
    spark: "The singer needs it two semitones higher. Just move the capo up 2 frets!" },
  { id: "capo_L8", title: "Multiple Solutions", skill: "capo_multi_position", level: 6,
    objective: "Compare capo strategies and choose the most practical.",
    exercises: ["multi_solution_compare"],
    spark: "Bb can be capo 3 + G shapes OR capo 1 + A shapes. Which is easier?" }
];

// ── Exercise Generators ──
var CapoExercises = {

  /**
   * Generate a shape-to-key drill.
   * @param {number} difficulty - 1-5
   * @returns {object} { type, prompt, capoFret, shapeRoot, correctAnswer, options }
   */
  shapeToKey: function(difficulty) {
    var maxFret = Math.min(2 + difficulty, 7);
    var capo = Math.floor(Math.random() * maxFret) + 1;
    var shape = SHAPE_FAMILIES[Math.floor(Math.random() * Math.min(3 + difficulty, 5))];
    var answer = transposeRoot(shape, capo);
    // Generate wrong options
    var options = [answer];
    while (options.length < 4) {
      var wrong = PC_TO_NAME[Math.floor(Math.random() * 12)];
      if (options.indexOf(wrong) === -1) options.push(wrong);
    }
    options.sort(function() { return Math.random() - 0.5; });
    return {
      type: "shape_to_key",
      prompt: "Capo " + capo + " + " + shape + " shape = ?",
      capoFret: capo,
      shapeRoot: shape,
      correctAnswer: answer,
      options: options
    };
  },

  /**
   * Generate a key-to-capo drill.
   * @param {number} difficulty
   * @returns {object} { type, prompt, targetKey, validSolutions }
   */
  keyToCapo: function(difficulty) {
    var keys = ["A", "Bb", "B", "C", "D", "Eb", "E", "F", "F#", "G", "Ab"];
    var target = keys[Math.floor(Math.random() * Math.min(4 + difficulty * 2, keys.length))];
    var solutions = findCapoSolutions(target);
    return {
      type: "key_to_capo",
      prompt: "Play in " + target + " using easy shapes. Choose capo + shape.",
      targetKey: target,
      validSolutions: solutions
    };
  },

  /**
   * Generate a progression labeling drill.
   * @param {number} difficulty
   * @returns {object} { type, prompt, capoFret, shapeProgression, soundingProgression, soundingKey }
   */
  progressionLabel: function(difficulty) {
    var progressions = [
      ["G", "D", "Em", "C"],
      ["C", "G", "Am", "F"],
      ["D", "A", "Bm", "G"],
      ["A", "E", "F#m", "D"],
      ["E", "B", "C#m", "A"]
    ];
    var prog = progressions[Math.floor(Math.random() * Math.min(2 + difficulty, progressions.length))];
    var capo = Math.floor(Math.random() * Math.min(3 + difficulty, 6)) + 1;
    var sounding = [];
    for (var i = 0; i < prog.length; i++) {
      var parsed = prog[i].match(/^([A-G][#b]?)(.*)/);
      var root = parsed[1], qual = parsed[2] || "";
      sounding.push(transposeRoot(root, capo) + qual);
    }
    return {
      type: "progression_label",
      prompt: "Play " + prog.join("-") + " with capo " + capo + ". What key are you in?",
      capoFret: capo,
      shapeProgression: prog,
      soundingProgression: sounding,
      soundingKey: transposeRoot(prog[0].match(/^([A-G][#b]?)/)[1], capo)
    };
  },

  /**
   * Generate a singer shift drill.
   * @param {number} difficulty
   * @returns {object} { type, prompt, originalCapo, shiftSemitones, newCapo, shapeRoot }
   */
  singerShift: function(difficulty) {
    var originalCapo = Math.floor(Math.random() * 4);
    var shift = (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);
    var newCapo = originalCapo + shift;
    if (newCapo < 0) newCapo += 12;
    if (newCapo > 9) newCapo = newCapo % 10;
    var shape = SHAPE_FAMILIES[Math.floor(Math.random() * 3)];
    return {
      type: "singer_shift",
      prompt: "Singer needs " + (shift > 0 ? "+" : "") + shift + " semitones. Currently capo " + originalCapo + " with " + shape + " shapes. New capo?",
      originalCapo: originalCapo,
      shiftSemitones: shift,
      newCapo: newCapo,
      shapeRoot: shape
    };
  },

  /**
   * Generate any exercise by type.
   * @param {string} type
   * @param {number} difficulty
   * @returns {object|null}
   */
  generate: function(type, difficulty) {
    difficulty = difficulty || 1;
    if (type === "shape_to_key") return this.shapeToKey(difficulty);
    if (type === "key_to_capo") return this.keyToCapo(difficulty);
    if (type === "progression_label") return this.progressionLabel(difficulty);
    if (type === "singer_shift") return this.singerShift(difficulty);
    // capo_place is simple: just return the target fret
    if (type === "capo_place") {
      return { type: "capo_place", prompt: "Place capo on fret " + (Math.floor(Math.random() * 5) + 1), targetFret: Math.floor(Math.random() * 5) + 1 };
    }
    return null;
  }
};

// ── Expose globals ──
window.CapoHelpers = {
  transposeRoot: transposeRoot,
  soundingChord: soundingChord,
  soundingKey: soundingKey,
  findCapoSolutions: findCapoSolutions,
  CAPO_CHART: CAPO_CHART,
  SHAPE_FAMILIES: SHAPE_FAMILIES,
  CAPO_SKILLS: CAPO_SKILLS,
  CAPO_LESSONS: CAPO_LESSONS,
  Exercises: CapoExercises
};

})();
```

- [ ] **Step 2: Commit**

```bash
git add js/instruments/guitar/capo.js
git commit -m "feat(guitar): create capo module — transposition helpers, skills, lessons, exercise generators"
```

---

### Task 2: Wire Capo into Guitar Registration

**Files:**
- Modify: `js/instruments/guitar/register.js`

- [ ] **Step 1: Add capo data to guitar getData()**

In `js/instruments/guitar/register.js`, add capo data to the `getData()` return object:

```javascript
        CAPO_CHART: typeof CapoHelpers !== "undefined" ? CapoHelpers.CAPO_CHART : {},
        CAPO_SKILLS: typeof CapoHelpers !== "undefined" ? CapoHelpers.CAPO_SKILLS : [],
        CAPO_LESSONS: typeof CapoHelpers !== "undefined" ? CapoHelpers.CAPO_LESSONS : [],
```

- [ ] **Step 2: Add capo branch to getSkillTree()**

In the `getSkillTree()` method, after the existing `buildSkillTree()` call, append capo nodes:

```javascript
    getSkillTree: function() {
      var tree = typeof buildSkillTree === "function" ? buildSkillTree() : { branches: [] };
      // Add capo branch
      if (typeof CapoHelpers !== "undefined") {
        var capoNodes = [];
        var skills = CapoHelpers.CAPO_SKILLS;
        for (var i = 0; i < skills.length; i++) {
          var sk = skills[i];
          var mastery = S.mastery && S.mastery.capo ? (S.mastery.capo[sk.id] || 0) : 0;
          capoNodes.push({
            id: sk.id,
            branch: "capo",
            label: sk.name,
            status: mastery > 0 ? (mastery >= 90 ? "mastered" : "developing") : "available",
            progress: mastery,
            meta: { category: "capo", desc: sk.desc }
          });
        }
        tree.branches.push({ id: "capo", label: "Capo & Transposition", nodes: capoNodes });
      }
      return tree;
    },
```

- [ ] **Step 3: Commit**

```bash
git add js/instruments/guitar/register.js
git commit -m "feat(guitar): wire capo data and skill tree into guitar registration"
```

---

### Task 3: Add Capo Sessions to Guitar Data

**Files:**
- Modify: `js/data.js`

- [ ] **Step 1: Add 3 capo-focused guided sessions to GUITAR_SESSIONS**

Find the end of the `GUITAR_SESSIONS` array in `js/data.js` and append 3 capo sessions (these come after the existing 50 sessions):

```javascript
  // ── Capo Sessions ──
  {num:51,title:"Hello, Capo",level:4,bpm:80,
   spark:{text:"A capo lets you play in any key using the chord shapes you already know."},
   newMove:{text:"Place capo on fret 2. Play G, C, D shapes — they now sound in the key of A!",chord:"G Major"},
   songSlice:{text:"Play G-C-D with capo 2. You're playing A-D-E!"},
   victoryLap:{text:"You just played in a new key without learning new chords."},
   ifThen:"If I want to play in a different key, then I reach for my capo."},
  {num:52,title:"Shape Detective",level:4,bpm:80,
   spark:{text:"Every fret the capo moves up raises the pitch by one semitone."},
   newMove:{text:"G shape + capo 3 = Bb. C shape + capo 2 = D. Learn to decode shapes!",chord:"C Major"},
   songSlice:{text:"Answer shape-to-key challenges — identify what key you're really in."},
   victoryLap:{text:"You can now read the capo key chart!"},
   ifThen:"If I see a capo position, then I can name the actual key."},
  {num:53,title:"Song in a New Key",level:5,bpm:85,
   spark:{text:"Many hit songs use a capo. Let's play one with easy shapes in a new key."},
   newMove:{text:"Set up capo and play a full progression. Identify both shape names and sounding names.",chord:"D Major"},
   songSlice:{text:"Play a song card with the correct capo setup."},
   victoryLap:{text:"You performed a song in a key you couldn't play before!"},
   ifThen:"If a song is in a hard key, then I find the right capo position."}
```

- [ ] **Step 2: Commit**

```bash
git add js/data.js
git commit -m "feat(guitar): add 3 capo-focused guided sessions to GUITAR_SESSIONS"
```

---

### Task 4: Add Script Tag and Verify

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add capo.js script tag**

Find the guitar instrument script block. Add capo.js AFTER `guitar/register.js` and BEFORE `guitar/app.js`:

```html
<script src="js/instruments/guitar/capo.js"></script>
```

- [ ] **Step 2: Verify in browser**

Open browser, select Guitar. In console:
```javascript
console.log(CapoHelpers.transposeRoot("G", 2));        // → "A"
console.log(CapoHelpers.soundingKey("G", 3));           // → "Bb"
console.log(CapoHelpers.findCapoSolutions("Bb"));       // → [{capoFret:1,shapeRoot:"A"}, {capoFret:3,shapeRoot:"G"}, ...]
console.log(CapoHelpers.Exercises.generate("shape_to_key", 2)); // → exercise object
console.log(SparkInstruments.getActive().getSkillTree()); // → should include capo branch
```

- [ ] **Step 3: Push**

```bash
git push
```
