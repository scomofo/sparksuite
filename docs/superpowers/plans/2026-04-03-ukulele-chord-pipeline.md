# Ukulele Chord Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the guitar-first chord rendering pipeline with an instrument-aware system so ukulele chords render on a correct 4-string neck, with validation and normalization.

**Architecture:** Create a generic variable-string renderer (`stringedChordSVG`) that both guitar and ukulele use. Add a ukulele normalizer that converts compact shape arrays into explicit chart objects. Add a validator that rejects impossible fingerings. Wire ukulele's `ui.chord()` through the new pipeline.

**Tech Stack:** Vanilla JavaScript, SVG rendering, script-tag loaded (no ES modules)

---

### Task 1: Create the generic stringed chord SVG renderer

**Files:**
- Create: `js/ui/stringed_chord_svg.js`
- Modify: `index.html` (add script tag)

This renderer accepts a normalized chart object with variable `stringCount`. It replaces the hardcoded `sC=6` assumption in the shared `chordSVG()`.

- [ ] **Step 1: Create `js/ui/stringed_chord_svg.js`**

```javascript
// js/ui/stringed_chord_svg.js
// Generic variable-string chord diagram renderer.
// Accepts a normalized chart object and renders an SVG fretboard
// for any string count (4 for ukulele, 6 for guitar, etc.)
(function() {

  function stringedChordSVG(chart, options) {
    options = options || {};
    chart = chart || {};

    var stringCount = chart.stringCount || 6;
    var stringLabels = chart.stringLabels || [];
    var fretCountVisible = chart.fretCountVisible || 4;
    var startFret = chart.startFret || 0;
    var fingers = chart.fingers || [];
    var open = chart.open || [];
    var muted = chart.muted || [];
    var barre = chart.barre || null;
    var chName = options.label || chart.name || "chord";
    var animate = options.animate || false;

    var sz = options.width || 200;
    var w = sz;
    var h = Math.round(sz * 1.3);

    // Scale padding proportionally to size
    var scale = sz / 200;
    var pL = Math.round(35 * scale);
    var pR = Math.round(20 * scale);
    var pT = Math.round(30 * scale);
    var pB = Math.round(20 * scale);

    var fH = (h - pT - pB) / fretCountVisible;
    var sW = stringCount > 1 ? (w - pL - pR) / (stringCount - 1) : 0;

    // Auto-compute startFret if fingers exceed visible window
    if (startFret === 0 && fingers.length > 0) {
      var minFret = 99, maxFret = 0;
      for (var fi = 0; fi < fingers.length; fi++) {
        var fFret = fingers[fi].fret || fingers[fi][1] || 0;
        if (fFret > 0) {
          if (fFret < minFret) minFret = fFret;
          if (fFret > maxFret) maxFret = fFret;
        }
      }
      if (barre) {
        if (barre.fret < minFret) minFret = barre.fret;
        if (barre.fret > maxFret) maxFret = barre.fret;
      }
      if (maxFret > fretCountVisible) startFret = minFret - 1;
    }

    // Accessible description
    var accDesc = "Chord diagram for " + escHTML(chName) + ".";

    var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + escHTML(accDesc) + '"><title>' + escHTML(accDesc) + '</title>';

    // Nut or fret-number indicator
    if (startFret === 0) {
      s += '<rect x="' + pL + '" y="' + pT + '" width="' + (w - pL - pR) + '" height="4" fill="var(--svg-nut)" rx="2"/>';
    } else {
      s += '<line x1="' + pL + '" y1="' + pT + '" x2="' + (w - pR) + '" y2="' + pT + '" stroke="var(--svg-fret)" stroke-width="2"/>';
      s += '<text x="' + (pL - Math.round(18 * scale)) + '" y="' + (pT + fH * 0.5 + 5) + '" text-anchor="middle" font-size="' + Math.round(13 * scale) + '" fill="var(--text-muted)" font-weight="bold">' + (startFret + 1) + '</text>';
    }

    // Fret lines
    for (var i = 0; i < fretCountVisible; i++) {
      s += '<line x1="' + pL + '" y1="' + (pT + fH * (i + 1)) + '" x2="' + (w - pR) + '" y2="' + (pT + fH * (i + 1)) + '" stroke="var(--svg-fret)" stroke-width="1.5"/>';
    }

    // String lines
    for (var i = 0; i < stringCount; i++) {
      var thick = stringCount <= 4 ? 1.6 : (i < 3 ? 2 : 1.2);
      s += '<line x1="' + (pL + i * sW) + '" y1="' + pT + '" x2="' + (pL + i * sW) + '" y2="' + (h - pB) + '" stroke="var(--svg-string)" stroke-width="' + thick + '"/>';
    }

    // Muted strings
    for (var i = 0; i < muted.length; i++) {
      if (muted[i]) {
        s += '<text x="' + (pL + i * sW) + '" y="' + (pT - Math.round(10 * scale)) + '" text-anchor="middle" font-size="' + Math.round(14 * scale) + '" fill="#FF6B6B" font-weight="bold">X</text>';
      }
    }

    // Open strings
    if (startFret === 0) {
      for (var i = 0; i < open.length; i++) {
        if (open[i]) {
          s += '<circle cx="' + (pL + i * sW) + '" cy="' + (pT - Math.round(12 * scale)) + '" r="' + Math.round(6 * scale) + '" fill="none" stroke="#4ECDC4" stroke-width="2"/>';
        }
      }
    }

    // Barre
    var isBarre = !!barre;
    var fDur = isBarre ? 0.5 : 0.5;
    var fStagger = isBarre ? 0.2 : 0.3;
    var fDelay = isBarre ? 0.6 : 0;

    if (barre) {
      var bFromStr = barre.fromString || 0;
      var bToStr = barre.toString || (stringCount - 1);
      var barX = pL + bFromStr * sW - Math.round(10 * scale);
      var barY = pT + (barre.fret - startFret - 0.5) * fH - 8;
      var barW = (bToStr - bFromStr) * sW + Math.round(20 * scale);
      var barCX = barX + barW / 2;
      var barCY = barY + 8;
      var barAnim = animate
        ? 'style="opacity:0;transform-origin:' + barCX + 'px ' + barCY + 'px;transform:scaleX(0);animation:barreIn 0.8s ease-out 0s forwards"'
        : 'style="opacity:0.85"';
      s += '<rect x="' + barX + '" y="' + barY + '" width="' + barW + '" height="16" rx="8" fill="#FF6B6B" ' + barAnim + '/>';
    }

    // Finger dots - supports both array [stringIdx, fret, fingerNum, color] and object {stringIndex, fret, finger, color}
    for (var i = 0; i < fingers.length; i++) {
      var f = fingers[i];
      var fStringIdx, fFret, fFingerNum, fColor;
      if (Array.isArray(f)) {
        fStringIdx = f[0]; fFret = f[1]; fFingerNum = f[2]; fColor = f[3] || "#FF6B6B";
      } else {
        fStringIdx = f.stringIndex; fFret = f.fret; fFingerNum = f.finger; fColor = f.color || "#FF6B6B";
      }
      var cx = pL + fStringIdx * sW;
      var cy = pT + (fFret - startFret - 0.5) * fH;
      var r = Math.min(Math.round(12 * scale), sz / 16);
      var animStyle = animate ? 'style="opacity:0;animation:fingerIn ' + fDur + 's ease-out ' + (fDelay + i * fStagger) + 's forwards"' : '';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fColor + '" stroke="#fff" stroke-width="2" ' + animStyle + '/>';
      s += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="' + Math.min(11, Math.round(sz / 18)) + '" fill="#fff" font-weight="bold" ' + animStyle + '>' + fFingerNum + '</text>';
    }

    // String labels
    for (var i = 0; i < stringLabels.length; i++) {
      s += '<text x="' + (pL + i * sW) + '" y="' + (h - Math.round(4 * scale)) + '" text-anchor="middle" font-size="' + Math.round(10 * scale) + '" fill="var(--text-muted)">' + escHTML(stringLabels[i]) + '</text>';
    }

    return s + '</svg>';
  }

  window.stringedChordSVG = stringedChordSVG;
})();
```

- [ ] **Step 2: Create `js/ui/` directory and add script tag to `index.html`**

Add after line 82 (before `js/ui.js`):
```html
<script src="js/ui/stringed_chord_svg.js"></script>
```

- [ ] **Step 3: Verify app still boots**

Open the app in a browser and confirm no console errors from the new script.

- [ ] **Step 4: Commit**

```bash
git add js/ui/stringed_chord_svg.js index.html
git commit -m "feat: add generic variable-string chord SVG renderer"
```

---

### Task 2: Create the ukulele chord normalizer

**Files:**
- Create: `js/instruments/ukulele/chord_normalizer.js`
- Modify: `index.html` (add script tag)

Converts compact ukulele shape arrays like `[0,0,0,3]` into the explicit normalized chart object that `stringedChordSVG` consumes.

- [ ] **Step 1: Create `js/instruments/ukulele/chord_normalizer.js`**

```javascript
// js/instruments/ukulele/chord_normalizer.js
// Converts compact ukulele chord source data into normalized chart objects
// for the generic stringed chord renderer.
(function() {

  var UKULELE_TUNING = ["G4", "C4", "E4", "A4"];
  var UKULELE_LABELS = ["G", "C", "E", "A"];
  var FINGER_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFE66D"];

  function normalizeUkuleleChord(source) {
    source = source || {};
    var name = source.name || "chord";
    var shape = source.shape || source.frets || [0, 0, 0, 0];
    var stringCount = 4;

    // Build open/muted arrays from shape
    var open = [];
    var muted = [];
    for (var i = 0; i < stringCount; i++) {
      var val = i < shape.length ? shape[i] : 0;
      if (val === -1 || val === "x" || val === "X") {
        muted.push(true);
        open.push(false);
      } else if (val === 0) {
        open.push(true);
        muted.push(false);
      } else {
        open.push(false);
        muted.push(false);
      }
    }

    // Build fingers from source or auto-assign
    var fingers;
    if (source.fingers && source.fingers.length > 0) {
      // Use provided fingers, normalize to object format
      fingers = [];
      for (var i = 0; i < source.fingers.length; i++) {
        var f = source.fingers[i];
        if (Array.isArray(f)) {
          fingers.push({
            stringIndex: f[0],
            fret: f[1],
            finger: f[2],
            color: f[3] || FINGER_COLORS[((f[2] || 1) - 1) % FINGER_COLORS.length]
          });
        } else {
          fingers.push({
            stringIndex: f.stringIndex != null ? f.stringIndex : f[0],
            fret: f.fret != null ? f.fret : f[1],
            finger: f.finger != null ? f.finger : f[2],
            color: f.color || FINGER_COLORS[((f.finger || 1) - 1) % FINGER_COLORS.length]
          });
        }
      }
    } else {
      // Auto-assign fingers from shape
      fingers = [];
      var fingerNum = 1;
      for (var i = 0; i < shape.length; i++) {
        if (shape[i] > 0) {
          fingers.push({
            stringIndex: i,
            fret: shape[i],
            finger: fingerNum,
            color: FINGER_COLORS[(fingerNum - 1) % FINGER_COLORS.length]
          });
          fingerNum++;
        }
      }
    }

    // Compute visible fret count and startFret
    var fretCountVisible = 4;
    var startFret = 0;
    if (fingers.length > 0) {
      var minFret = 99, maxFret = 0;
      for (var i = 0; i < fingers.length; i++) {
        if (fingers[i].fret > 0) {
          if (fingers[i].fret < minFret) minFret = fingers[i].fret;
          if (fingers[i].fret > maxFret) maxFret = fingers[i].fret;
        }
      }
      if (maxFret > fretCountVisible) {
        startFret = minFret - 1;
      }
      // Ensure all fingers fit in visible window
      if (maxFret - startFret > fretCountVisible) {
        fretCountVisible = maxFret - startFret;
      }
    }

    return {
      name: name,
      instrument: "ukulele",
      stringCount: stringCount,
      tuning: UKULELE_TUNING.slice(),
      stringLabels: UKULELE_LABELS.slice(),
      fretCountVisible: fretCountVisible,
      startFret: startFret,
      open: open,
      muted: muted,
      fingers: fingers,
      barre: source.barre || null
    };
  }

  window.normalizeUkuleleChord = normalizeUkuleleChord;
})();
```

- [ ] **Step 2: Add script tag to `index.html`**

Add before the ukulele register.js line (before line 68 `<script src="js/instruments/ukulele/register.js"></script>`):
```html
<script src="js/instruments/ukulele/chord_normalizer.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/instruments/ukulele/chord_normalizer.js index.html
git commit -m "feat: add ukulele chord normalizer for shape-to-chart conversion"
```

---

### Task 3: Create the ukulele chord validator

**Files:**
- Create: `js/instruments/ukulele/validator.js`
- Modify: `index.html` (add script tag)

Validates normalized chart objects and rejects impossible fingerings in development builds.

- [ ] **Step 1: Create `js/instruments/ukulele/validator.js`**

```javascript
// js/instruments/ukulele/validator.js
// Validates normalized chord chart objects for ukulele.
// Returns an array of error strings. Empty array = valid.
(function() {

  function validateChordChart(chart) {
    var errors = [];
    if (!chart) { errors.push("Chart object is null or undefined."); return errors; }

    var sc = chart.stringCount;

    // stringCount must match tuning and labels
    if (chart.tuning && chart.tuning.length !== sc) {
      errors.push("tuning.length (" + chart.tuning.length + ") !== stringCount (" + sc + ").");
    }
    if (chart.stringLabels && chart.stringLabels.length !== sc) {
      errors.push("stringLabels.length (" + chart.stringLabels.length + ") !== stringCount (" + sc + ").");
    }

    // open and muted must match stringCount
    if (chart.open && chart.open.length !== sc) {
      errors.push("open.length (" + chart.open.length + ") !== stringCount (" + sc + ").");
    }
    if (chart.muted && chart.muted.length !== sc) {
      errors.push("muted.length (" + chart.muted.length + ") !== stringCount (" + sc + ").");
    }

    // Finger validation
    var fingerMap = {}; // "stringIndex:fret" -> count
    var fingers = chart.fingers || [];
    for (var i = 0; i < fingers.length; i++) {
      var f = fingers[i];
      var sIdx = f.stringIndex != null ? f.stringIndex : (Array.isArray(f) ? f[0] : null);
      var fret = f.fret != null ? f.fret : (Array.isArray(f) ? f[1] : null);
      var fNum = f.finger != null ? f.finger : (Array.isArray(f) ? f[2] : null);

      // No finger outside string range
      if (sIdx < 0 || sIdx >= sc) {
        errors.push("Finger " + i + ": stringIndex " + sIdx + " outside 0.." + (sc - 1) + ".");
      }

      // No finger at fret < 1
      if (fret < 1) {
        errors.push("Finger " + i + ": fret " + fret + " < 1.");
      }

      // Finger number should be 1..4 for ukulele
      if (fNum !== null && fNum !== undefined && (fNum < 1 || fNum > 4)) {
        errors.push("Finger " + i + ": finger number " + fNum + " outside 1..4.");
      }

      // Duplicate check
      var key = sIdx + ":" + fret;
      if (fingerMap[key]) {
        errors.push("Duplicate finger at string " + sIdx + " fret " + fret + ".");
      }
      fingerMap[key] = true;

      // Open+finger conflict
      if (chart.open && sIdx >= 0 && sIdx < chart.open.length && chart.open[sIdx]) {
        errors.push("String " + sIdx + " is marked open but also has a finger at fret " + fret + ".");
      }

      // Muted+finger conflict
      if (chart.muted && sIdx >= 0 && sIdx < chart.muted.length && chart.muted[sIdx]) {
        errors.push("String " + sIdx + " is marked muted but also has a finger at fret " + fret + ".");
      }
    }

    // Muted+open conflict
    if (chart.open && chart.muted) {
      for (var i = 0; i < sc; i++) {
        if (chart.open[i] && chart.muted[i]) {
          errors.push("String " + i + " is both open and muted.");
        }
      }
    }

    // Barre validation
    if (chart.barre) {
      var b = chart.barre;
      if (b.fret < 1) {
        errors.push("Barre fret " + b.fret + " < 1.");
      }
      if (b.fromString != null && (b.fromString < 0 || b.fromString >= sc)) {
        errors.push("Barre fromString " + b.fromString + " outside 0.." + (sc - 1) + ".");
      }
      if (b.toString != null && (b.toString < 0 || b.toString >= sc)) {
        errors.push("Barre toString " + b.toString + " outside 0.." + (sc - 1) + ".");
      }
    }

    return errors;
  }

  window.validateChordChart = validateChordChart;
})();
```

- [ ] **Step 2: Add script tag to `index.html`**

Add after `chord_normalizer.js` and before ukulele `register.js`:
```html
<script src="js/instruments/ukulele/validator.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/instruments/ukulele/validator.js index.html
git commit -m "feat: add ukulele chord chart validator"
```

---

### Task 4: Create the ukulele SVG wrapper and wire into register.js

**Files:**
- Create: `js/instruments/ukulele/ukulele_svg.js`
- Modify: `js/instruments/ukulele/register.js`
- Modify: `index.html`

The ukulele SVG wrapper calls `normalizeUkuleleChord` then `stringedChordSVG` with ukulele defaults.

- [ ] **Step 1: Create `js/instruments/ukulele/ukulele_svg.js`**

```javascript
// js/instruments/ukulele/ukulele_svg.js
// Ukulele-specific chord renderer wrapper.
// Normalizes input, validates in dev mode, then calls the generic renderer.
(function() {

  function ukuleleSVG(chordObj, options) {
    options = options || {};
    var source = chordObj || {};

    // If already a normalized chart with instrument=ukulele, use directly
    var chart;
    if (source.instrument === "ukulele" && source.stringCount === 4 && source.fingers) {
      chart = source;
    } else {
      // Normalize from compact source
      chart = normalizeUkuleleChord(source);
    }

    // Dev-mode validation (log warnings, don't break rendering)
    if (typeof validateChordChart === "function") {
      var errors = validateChordChart(chart);
      if (errors.length > 0) {
        console.warn("[UkuleleSVG] Validation errors for " + (chart.name || "unknown") + ":", errors);
      }
    }

    // Merge options with ukulele defaults
    var renderOpts = {
      width: options.width || options.size || 170,
      label: options.label || chart.name,
      animate: options.animate || false
    };

    return stringedChordSVG(chart, renderOpts);
  }

  window.ukuleleSVG = ukuleleSVG;
})();
```

- [ ] **Step 2: Add script tag to `index.html`**

Add after `validator.js` and before ukulele `register.js`:
```html
<script src="js/instruments/ukulele/ukulele_svg.js"></script>
```

- [ ] **Step 3: Update `js/instruments/ukulele/register.js` to use the new pipeline**

Replace the inline `renderUkuleleChordSVG` function and update `ui.chord()` to use `ukuleleSVG`. The old `renderUkuleleChordSVG` becomes a thin wrapper that delegates to `ukuleleSVG`.

In `js/instruments/ukulele/register.js`, replace lines 67-104 (the `renderUkuleleChordSVG` function):

```javascript
  function renderUkuleleChordSVG(chordObj, size, label) {
    // Delegate to the new pipeline: normalizer -> validator -> generic renderer
    return ukuleleSVG(chordObj, { width: size, label: label });
  }
```

The `ui.chord()` at line 235 already calls `renderUkuleleChordSVG` so it will automatically pick up the new pipeline.

- [ ] **Step 4: Verify ukulele chords render correctly**

Open the app, activate ukulele, and check the Practice tab chord gallery renders 4-string diagrams for C, Am, F, G, G7, Dm, Em, A.

- [ ] **Step 5: Commit**

```bash
git add js/instruments/ukulele/ukulele_svg.js js/instruments/ukulele/register.js index.html
git commit -m "feat: wire ukulele chord rendering through normalizer/validator pipeline"
```

---

### Task 5: Migrate guitar to the generic renderer

**Files:**
- Modify: `js/instruments/guitar/register.js`
- Modify: `js/ui.js`

Keep `chordSVG()` in `js/ui.js` as-is for backward compatibility, but update guitar's `ui.chord()` to use `stringedChordSVG` when available, falling back to the legacy `chordSVG`. This ensures guitar renders identically or better.

- [ ] **Step 1: Update guitar `ui.chord()` in `js/instruments/guitar/register.js`**

Replace lines 35-37:
```javascript
      chord: function(chordObj, size, label, animate) {
        if (typeof stringedChordSVG === "function" && chordObj) {
          // Build a guitar-compatible chart for the generic renderer
          var chart = {
            name: chordObj.name || label || "chord",
            instrument: "guitar",
            stringCount: 6,
            stringLabels: typeof STRING_NAMES !== "undefined" ? STRING_NAMES : ["E","A","D","G","B","e"],
            fretCountVisible: 4,
            startFret: 0,
            open: chordObj.open || [],
            muted: chordObj.muted || [],
            fingers: chordObj.fingers || [],
            barre: chordObj.barFret ? { fret: chordObj.barFret, fromString: Math.min.apply(null, chordObj.barStrings || [0]), toString: Math.max.apply(null, chordObj.barStrings || [5]) } : null
          };
          return stringedChordSVG(chart, { width: size, label: label, animate: animate });
        }
        return typeof chordSVG === "function" ? chordSVG(chordObj, size, label, animate) : "";
      },
```

- [ ] **Step 2: Verify guitar chords render correctly**

Open the app, activate guitar, and verify chord diagrams look correct. Check a few barre chords (F, Bm) and open chords (G, C, D, Em).

- [ ] **Step 3: Commit**

```bash
git add js/instruments/guitar/register.js
git commit -m "feat: migrate guitar chord rendering to generic stringed renderer"
```

---

### Task 6: Validate all ukulele chord data

**Files:**
- Modify: `js/sparksuite/instruments/ukulele/ukulele_chords.js` (fix any bad data)

Run every ukulele chord through the normalizer and validator. Fix any data issues found.

- [ ] **Step 1: Add a dev-time validation pass in ukulele_chords.js**

Add at the end of the IIFE in `js/sparksuite/instruments/ukulele/ukulele_chords.js`, before the closing `})();`:

```javascript
  // Dev validation: check all chords through normalizer + validator
  if (typeof normalizeUkuleleChord === "function" && typeof validateChordChart === "function") {
    for (var i = 0; i < allChords.length; i++) {
      var normalized = normalizeUkuleleChord(allChords[i]);
      var errors = validateChordChart(normalized);
      if (errors.length > 0) {
        console.warn("[UkuleleChords] Validation errors for " + allChords[i].name + ":", errors);
      }
    }
  }
```

- [ ] **Step 2: Check console for validation warnings**

Open the app and check the browser console for any `[UkuleleChords]` warnings. Fix source data if needed.

Verify the known-good shapes from the handoff document:
- C: [0,0,0,3] - 1 finger on string 3 fret 3
- Am: [2,0,0,0] - 1 finger on string 0 fret 2
- F: [2,0,1,0] - 2 fingers
- G: [0,2,3,2] - 3 fingers
- G7: [0,2,1,2] - 3 fingers
- Dm: [2,2,1,0] - 3 fingers
- Em: [0,4,3,2] - 3 fingers
- A: [2,1,0,0] - 2 fingers

- [ ] **Step 3: Commit**

```bash
git add js/sparksuite/instruments/ukulele/ukulele_chords.js
git commit -m "feat: add dev-time validation for all ukulele chord data"
```

---

### Task 7: Create ukulele chord smoke-test gallery

**Files:**
- Create: `tests/ukulele_chord_gallery.html`

A standalone HTML page that renders all common ukulele chord shapes for quick visual inspection.

- [ ] **Step 1: Create `tests/ukulele_chord_gallery.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ukulele Chord Gallery - Smoke Test</title>
<style>
  :root {
    --svg-nut: #333; --svg-fret: #999; --svg-string: #666;
    --text-muted: #888; --text-primary: #222; --border: #ddd;
    --card-bg: #fff;
  }
  body { font-family: system-ui, sans-serif; background: #f5f5f5; padding: 24px; }
  h1 { font-size: 24px; margin-bottom: 16px; }
  .gallery { display: flex; flex-wrap: wrap; gap: 16px; }
  .chord-card {
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px; text-align: center; min-width: 140px;
  }
  .chord-card h3 { margin: 8px 0 4px; font-size: 14px; }
  .chord-card .shape { font-size: 11px; color: var(--text-muted); }
  .status { margin-top: 16px; padding: 12px; background: #e8f5e9; border-radius: 8px; }
  .status.has-errors { background: #fce4ec; }
</style>
</head>
<body>
<h1>Ukulele Chord Gallery - Smoke Test</h1>
<div id="status" class="status">Loading...</div>
<div id="gallery" class="gallery"></div>

<script>function escHTML(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}</script>
<script src="../js/ui/stringed_chord_svg.js"></script>
<script src="../js/instruments/ukulele/chord_normalizer.js"></script>
<script src="../js/instruments/ukulele/validator.js"></script>
<script src="../js/instruments/ukulele/ukulele_svg.js"></script>
<script>
(function() {
  var SHAPES = {
    C: [0, 0, 0, 3],
    Am: [2, 0, 0, 0],
    F: [2, 0, 1, 0],
    G: [0, 2, 3, 2],
    G7: [0, 2, 1, 2],
    Dm: [2, 2, 1, 0],
    Em: [0, 4, 3, 2],
    A: [2, 1, 0, 0],
    D: [2, 2, 2, 0],
    E: [1, 4, 0, 2],
    Bb: [3, 2, 1, 1],
    C7: [0, 0, 0, 1],
    Am7: [0, 0, 0, 0],
    Dm7: [2, 2, 1, 3],
    Em7: [0, 2, 0, 2],
    Cmaj7: [0, 0, 0, 2],
    Fmaj7: [2, 4, 1, 3],
    A7: [0, 1, 0, 0]
  };

  var gallery = document.getElementById("gallery");
  var status = document.getElementById("status");
  var totalErrors = 0;

  for (var name in SHAPES) {
    if (!Object.prototype.hasOwnProperty.call(SHAPES, name)) continue;
    var source = { name: name, frets: SHAPES[name] };
    var normalized = normalizeUkuleleChord(source);
    var errors = validateChordChart(normalized);
    totalErrors += errors.length;

    var card = document.createElement("div");
    card.className = "chord-card" + (errors.length ? " has-errors" : "");
    card.innerHTML = ukuleleSVG(source, { width: 150, label: name }) +
      '<h3>' + escHTML(name) + '</h3>' +
      '<div class="shape">' + SHAPES[name].join("-") + '</div>' +
      (errors.length ? '<div style="color:#c62828;font-size:11px;margin-top:4px">' + errors.join("<br>") + '</div>' : '');
    gallery.appendChild(card);
  }

  status.textContent = "Rendered " + Object.keys(SHAPES).length + " chords. " +
    (totalErrors === 0 ? "All valid!" : totalErrors + " validation error(s) found.");
  if (totalErrors > 0) status.className = "status has-errors";
})();
</script>
</body>
</html>
```

- [ ] **Step 2: Open the gallery in a browser and visually verify**

Open `tests/ukulele_chord_gallery.html` directly in a browser. Check:
- All diagrams show 4 strings labeled G-C-E-A
- Finger dots appear at correct positions
- Open strings show circles above the nut
- No validation errors are displayed
- C (0003) shows one dot on string 4 fret 3
- Am (2000) shows one dot on string 1 fret 2
- F (2010) shows two dots
- All shapes look physically playable

- [ ] **Step 3: Commit**

```bash
git add tests/ukulele_chord_gallery.html
git commit -m "feat: add ukulele chord smoke-test gallery page"
```

---

### Task 8: Architecture Roadmap Phase 0 - Stabilize and document

**Files:**
- Create: `docs/engineering/architecture-map.md`
- Create: `docs/engineering/smoke-tests.md`

Document the current startup flow and smoke test paths. No behavior changes.

- [ ] **Step 1: Create `docs/engineering/architecture-map.md`**

```markdown
# SparkSuite Architecture Map

## Boot Order (index.html)

1. **Core Utilities** - spark-highway, contracts, time/math/ids utils, persistence, analytics, progression
2. **Spark-Core v0.2** - profile, storage, events, progress-engine, achievements, content, psychology, progress-orchestrator, instrument-adapter, session-engine, index (namespace barrel)
3. **Performance-Core** - chart-contract, transport-contract, highway-adapter, events, index
4. **Launcher** - SparkInstruments registry (register/activate/getActive)
5. **Instrument Modules** - guitar (pages, capo, register, app), ukulele (normalizer, validator, svg, register), piano (data, audio, ui, register, app), bass (data, ui, register, app), drums (register)
6. **Shared UI + Data** - data.js, state.js, audio.js, ui.js (chordSVG, ringHTML, etc.)
7. **Page Renderers** - shared, practice, session, games, songs, tools, guided, dual
8. **Performance System** - config, difficulties, arrangements, adapters, chart, transport, input, calibration, scoring, session, progression, recommendations, practice_engine, analytics, badges, highway, midi_backing
9. **Performance Pages** - perform, rhythm_highway, perform_song, performance_stats, editor, calibration
10. **Practice Stack** - exercises/generator, weakspots, adaptive, plan, progress, selectors, engine, launchers
11. **SparkSuite Domain** - types, session_segment, session, tempo_map, note_event, phrase, chart, gameplay_result, engine_preset
12. **Bridges** - practice_bridge, curriculum_bridge, progress_bridge, performance_bridge
13. **SparkSuite Instruments** - ukulele (skill_tree, lessons, chords, scales, tuning, exercises, progression, module, adapter, index), bass, piano, guitar
14. **SparkSuite Core** - storage, ai_engine, instrument_manager, psychology_engine, curriculum_engine, calibration_engine, timing_engine, chart_io, replay_engine, input_judge, scoring_engine, rhythm_gameplay_engine, practice_engine, progress_engine, session_engine, **spark_core.js** (composition root)
15. **Progression** - adaptive, mastery, unlocks, tree, progress_ui, skill_tree
16. **Meta** - xp, levels, achievements, profile, challenges, weekly_goals, skill_tree_meta, meta_progress, dashboard
17. **Analytics** - stats, trends, charts, reports, dashboard
18. **Editor, MIDI, Desktop, Cloud, Content, Curriculum, Recommend, Career, Insights, Challenges, Home, Settings, Onboarding**
19. **app.js** - final initialization

## Key Globals

- `S` - Application state (loaded/saved via state.js)
- `SparkInstruments` - Instrument registry (launcher.js)
- `SparkCore` (v0.2 barrel) - window.SparkCore namespace pointing at individual engine globals
- `SparkSuiteCore` - Constructor-based composition root (js/sparksuite/core/spark_core.js), instantiated in app.js

## Composition Roots

### Legacy: `window.SparkCore` (js/spark-core/index.js)
Namespace barrel. Points at: SparkProfile, SparkStorage, SparkEvents, SparkProgress, SparkAchievements, SparkContent, SparkContentNormalizer, SparkSession, SparkPsychology, SparkInstrumentAdapter, SparkProgressOrchestrator.

### Current: `SparkSuiteCore` (js/sparksuite/core/spark_core.js)
Constructor-based. Instantiates: SparkSuiteStorage, SparkAIEngine, SparkInstrumentManager, SparkSuitePsychologyEngine, SparkSuiteCurriculumEngine, SparkSuitePracticeEngine, SparkSuiteProgressEngine, SparkSuiteSessionEngine. Manages runtime state, session plans, performance editor, all flow orchestration.

## Instrument Module Contract

Each instrument registers via `SparkInstruments.register({...})`:
- `id`, `instrument`, `name`, `icon`, `skin`, `available`
- `getData()` -> { CHORDS, ALL_CHORDS, SESSIONS, SONGS, LC, LN, ... }
- `ui` -> { chord(), header(), tabNav(), ring() }
- `tabRenderers` -> { practice, songs, stats, guide }
- `pages` -> { screenId: renderFn }
- `tabs` -> [{ id, label, icon }]
- `init()`, `getSkillTree()`, `getCurriculumMap()`, `getExercises()`, `getSongs()`
- `getDifficultyRules()`, `analyzePerformance()`, `generateDrills()`

## Session Flow

1. UI calls `SparkSession.buildSession({ mode, level, ... })`
2. Session engine reads instrument data via `SparkInstruments.getActive().getData()`
3. Returns session plan: { type, chord, duration, level }
4. On completion, `SparkSession.processResults(results)` handles:
   - Streak, XP, chord mastery, level-up, badges, progress cascade
5. `SparkProgressOrchestrator.evaluateAll(event)` runs 12-step cascade
```

- [ ] **Step 2: Create `docs/engineering/smoke-tests.md`**

```markdown
# SparkSuite Smoke Test Checklist

## App Boot
- [ ] index.html loads without console errors
- [ ] Home dashboard renders
- [ ] Instrument tiles appear

## Instrument Activation
- [ ] Guitar: activates, shows practice tab
- [ ] Ukulele: activates, shows practice tab with 4-string chord diagrams
- [ ] Piano: activates, shows keyboard-style chord display
- [ ] Bass: activates, shows 4-string fretboard

## Practice Flow
- [ ] Quick Start launches a session with random chord
- [ ] Timer counts down
- [ ] Session completes, XP awarded
- [ ] Streak increments on first daily session

## Performance Flow
- [ ] Open a performance chart
- [ ] Highway renders with correct lane count
- [ ] Scoring produces results
- [ ] Results save and appear in stats

## Save/Load
- [ ] State persists across page refresh
- [ ] Profile data loads correctly
- [ ] No data corruption on repeated saves

## Chord Rendering
- [ ] Guitar chords: 6-string diagrams, correct finger positions
- [ ] Ukulele chords: 4-string diagrams (G-C-E-A), correct finger positions
- [ ] Bass chords: 4-string fretboard notation
- [ ] Piano chords: keyboard visualization
- [ ] Barre chords render correctly for guitar
```

- [ ] **Step 3: Commit**

```bash
git add docs/engineering/architecture-map.md docs/engineering/smoke-tests.md
git commit -m "docs: add architecture map and smoke test checklist (Phase 0)"
```

---

### Task 9: Architecture Roadmap Phase 1 - Evolve SparkCore namespace to point at composition root

**Files:**
- Modify: `js/spark-core/index.js`

The composition root already exists as `SparkSuiteCore` in `js/sparksuite/core/spark_core.js`. Phase 1 is about making the legacy `window.SparkCore` namespace aware of it and adding a `getServices()` method.

- [ ] **Step 1: Update `js/spark-core/index.js` to bridge to composition root**

Replace the entire file content:

```javascript
// js/spark-core/index.js
// Barrel — all spark-core modules are loaded as individual scripts.
// This file bridges the legacy namespace to the new composition root.
(function() {
  window.SparkCore = {
    version: "0.3.0",

    // Legacy module references (backward compatibility)
    Profile: window.SparkProfile,
    Storage: window.SparkStorage,
    Events: window.SparkEvents,
    Progress: window.SparkProgress,
    Achievements: window.SparkAchievements,
    Content: window.SparkContent,
    ContentNormalizer: window.SparkContentNormalizer,

    // Core engines (v0.2.0 globals)
    Session: window.SparkSession,
    Psychology: window.SparkPsychology,
    InstrumentAdapter: window.SparkInstrumentAdapter,
    ProgressOrchestrator: window.SparkProgressOrchestrator,

    // Service registry: single resolution point for engines
    getServices: function() {
      return {
        session: window.SparkSession,
        psychology: window.SparkPsychology,
        instrumentAdapter: window.SparkInstrumentAdapter,
        progressOrchestrator: window.SparkProgressOrchestrator,
        profile: window.SparkProfile,
        storage: window.SparkStorage,
        events: window.SparkEvents,
        progress: window.SparkProgress,
        achievements: window.SparkAchievements,
        content: window.SparkContent,
        contentNormalizer: window.SparkContentNormalizer
      };
    }
  };
})();
```

- [ ] **Step 2: Verify app boots with no regressions**

Confirm `SparkCore.getServices()` returns the expected object in console. Confirm existing code that reads `SparkCore.Session` etc. still works.

- [ ] **Step 3: Commit**

```bash
git add js/spark-core/index.js
git commit -m "feat: evolve SparkCore namespace to v0.3.0 with getServices() registry"
```

---

### Task 10: Architecture Roadmap Phase 2 - Define normalized contracts

**Files:**
- Create: `js/spark-core/runtime/contracts.js`
- Modify: `index.html`

Define the SessionPlan, SessionResult, and ProgressOutcome contracts as documented factory functions.

- [ ] **Step 1: Create `js/spark-core/runtime/contracts.js`**

```javascript
// js/spark-core/runtime/contracts.js
// Normalized contracts for session planning, results, and progress outcomes.
// These are factory functions that create contract-conforming objects.
(function() {

  /**
   * SessionPlan — returned by SessionEngine.buildSession()
   */
  function createSessionPlan(opts) {
    opts = opts || {};
    return {
      sessionId: opts.sessionId || ("sp_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8)),
      instrumentId: opts.instrumentId || null,
      instrumentType: opts.instrumentType || null,
      mode: opts.mode || "quickStart",
      lessonRef: opts.lessonRef || null,
      segments: opts.segments || [],
      exercises: opts.exercises || [],
      goals: opts.goals || [],
      difficulty: opts.difficulty || 1,
      estimatedDuration: opts.estimatedDuration || 120,
      chord: opts.chord || null,
      chordName: opts.chordName || null,
      metadata: opts.metadata || {}
    };
  }

  /**
   * SessionResult — submitted by pages/flows on completion
   */
  function createSessionResult(opts) {
    opts = opts || {};
    return {
      sessionId: opts.sessionId || null,
      mode: opts.mode || "session",
      instrumentId: opts.instrumentId || null,
      instrumentType: opts.instrumentType || null,
      exerciseResults: opts.exerciseResults || [],
      accuracy: opts.accuracy || 0,
      timing: opts.timing || null,
      duration: opts.duration || 0,
      songId: opts.songId || null,
      lessonRef: opts.lessonRef || null,
      chordName: opts.chordName || null,
      completed: opts.completed !== false
    };
  }

  /**
   * ProgressOutcome — returned by ProgressEngine after applying a result
   */
  function createProgressOutcome(opts) {
    opts = opts || {};
    return {
      xpEarned: opts.xpEarned || 0,
      levelUps: opts.levelUps || [],
      masteryChanges: opts.masteryChanges || {},
      unlocks: opts.unlocks || [],
      achievements: opts.achievements || [],
      streakChanges: opts.streakChanges || null,
      comebackBonus: opts.comebackBonus || 0,
      nextRecommendation: opts.nextRecommendation || null
    };
  }

  window.SparkContracts = {
    createSessionPlan: createSessionPlan,
    createSessionResult: createSessionResult,
    createProgressOutcome: createProgressOutcome
  };
})();
```

- [ ] **Step 2: Add script tag to `index.html`**

Add after the spark-core `session-engine.js` (line 53) and before `index.js` (line 54):
```html
<script src="js/spark-core/runtime/contracts.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add js/spark-core/runtime/contracts.js index.html
git commit -m "feat: define SessionPlan, SessionResult, ProgressOutcome contracts (Phase 2)"
```

---

### Task 11: Architecture Roadmap Phase 3 - Add ProgressEngine facade

**Files:**
- Modify: `js/spark-core/progress-orchestrator.js`

Add an `applySessionOutcome(result)` method that accepts a `SessionResult` and returns a `ProgressOutcome`. This wraps the existing `evaluateAll` cascade behind a single entry point.

- [ ] **Step 1: Add `applySessionOutcome` to progress-orchestrator.js**

Add after `evaluateAll` (before the closing return statement), around line 128:

```javascript
    /**
     * applySessionOutcome(sessionResult)
     * Single entry point for post-session state updates.
     * Accepts a SessionResult contract, runs the full cascade, and returns a ProgressOutcome.
     */
    applySessionOutcome: function(sessionResult) {
      sessionResult = sessionResult || {};

      // Map SessionResult to the evaluateAll event shape
      var event = {
        type: sessionResult.mode || "session",
        chordName: sessionResult.chordName || null,
        accuracy: sessionResult.accuracy || 0,
        xpAwarded: 0, // Will be computed
        duration: sessionResult.duration || 0,
        songId: sessionResult.songId || null,
        streakUpdated: false
      };

      // Compute XP via existing logic
      var jackpot = typeof SparkPsychology !== "undefined" ? SparkPsychology.shouldJackpot() : (Math.random() < 1/15);
      event.xpAwarded = jackpot ? 50 : 10;

      // Check streak
      if (typeof SparkState !== "undefined" && typeof SparkState.getRoot === "function" && SparkState.getRoot()) {
        var today = new Date().toISOString().slice(0, 10);
        if (SparkState.read(["lastSessionDate"], null) !== today) {
          event.streakUpdated = true;
        }
      }

      // Run the full cascade
      var cascadeResult = this.evaluateAll(event);

      // Return structured ProgressOutcome
      if (typeof SparkContracts !== "undefined") {
        return SparkContracts.createProgressOutcome({
          xpEarned: cascadeResult.xpTotal || event.xpAwarded,
          levelUps: cascadeResult.leveledUp ? [{ newLevel: cascadeResult.newLevel }] : [],
          masteryChanges: cascadeResult.masteryUpdates || {},
          unlocks: cascadeResult.newUnlocks || [],
          achievements: cascadeResult.newAchievements || [],
          streakChanges: event.streakUpdated ? { incremented: true } : null,
          comebackBonus: 0,
          nextRecommendation: null
        });
      }

      return cascadeResult;
    }
```

- [ ] **Step 2: Verify existing evaluateAll still works**

Open the app, complete a session, and confirm progression cascade fires normally.

- [ ] **Step 3: Commit**

```bash
git add js/spark-core/progress-orchestrator.js
git commit -m "feat: add ProgressEngine applySessionOutcome facade (Phase 3)"
```

---

### Task 12: Architecture Roadmap Phase 4 - Document instrument module contract

**Files:**
- Create: `docs/engineering/instrument-module-contract.md`

Formal specification for what instrument modules must implement.

- [ ] **Step 1: Create `docs/engineering/instrument-module-contract.md`**

```markdown
# Instrument Module Contract

## Required Registration Fields

Every instrument registers via `SparkInstruments.register(config)` with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique app identifier (e.g. "chordspark", "ukespark") |
| `instrument` | string | yes | Instrument type ("guitar", "ukulele", "piano", "bass") |
| `name` | string | yes | Display name |
| `icon` | string | yes | Emoji or HTML entity |
| `skin` | object | no | Highway skin config: { laneCount, labels } |
| `available` | boolean | yes | Whether selectable by user |

## Required Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getData()` | object | { CHORDS, ALL_CHORDS, SESSIONS, SONGS, LC, LN, CHORD_NOTES, STRINGS, STRUM_PATTERNS, FINGER_EXERCISES, CURRICULUM, SKILL_TREE } |
| `init()` | void | One-time initialization on activation |
| `getSkillTree()` | { branches: [] } | Skill tree for progression UI |
| `getCurriculumMap()` | array | Lesson/curriculum data |
| `getExercises(skill?)` | array | Exercises for current or given skill |
| `getSongs()` | array | Available songs |
| `getDifficultyRules(context?)` | object | { targetType, difficultyAction, currentValue, nextValue, reason } |
| `analyzePerformance(sessionData)` | object | { accuracy, avgScore, stars } |
| `generateDrills(skill?, level?)` | array | Generated drill exercises |

## Required UI Overrides

| Method | Returns | Description |
|--------|---------|-------------|
| `ui.chord(chordObj, size, label, animate)` | string (SVG HTML) | Chord/note diagram for this instrument |
| `ui.header()` | string (HTML) | Instrument-specific header content |
| `ui.ring(pct, size, color)` | string (HTML) | Progress ring |

## Capability Flags (recommended)

Add to skin or top-level config:
- `stringCount` - number of strings (null for non-stringed)
- `noteLaneType` - "string" | "key" | "pad"
- `chordShapeSupport` - boolean
- `midiInput` - boolean
- `capoSupport` - boolean
- `performanceModes` - ["rhythm", "freestyle", "song"]

## Tab Renderers

Each instrument provides `tabRenderers: { practice, songs, stats, guide }` where each value is a `function()` returning HTML string.
```

- [ ] **Step 2: Commit**

```bash
git add docs/engineering/instrument-module-contract.md
git commit -m "docs: add instrument module contract specification (Phase 4)"
```
