# ChordSpark Improvement Plan

Actionable fixes and improvements organized by priority. Each section includes the problem, affected files/lines, and what to do.

---

## P0 — Security

### 1. XSS via innerHTML rendering

**Problem:** The entire UI is built as HTML strings and set via `app.innerHTML`. User-supplied data (custom set names, imported song titles/artists, community song data) is not consistently escaped. The `submitField` action writes raw values into `S.submitSong`, and community songs parsed from the server are rendered without sanitization.

**Files:** `js/app.js:655-659`, `js/app.js:638-653`, `js/app.js:852`

**Fix:**
- Audit every place user or external data enters the HTML string. Ensure all values pass through `escHTML()` before being interpolated into markup.
- In `submitField`, escape values on render, not on input.
- For community song data (`playCommunity`), escape `song.title`, `song.artist`, and any other rendered fields after `JSON.parse`.
- Consider a helper like `h += tag('h3', escHTML(title))` to make safe rendering the default path.

### 2. Community API over HTTP

**Problem:** `COMMUNITY_URL = "http://localhost:3456"` — fine for local dev, but if this ever points at a real server it must be HTTPS.

**File:** `js/app.js:97`

**Fix:**
- Change to `https://` for any non-localhost URL.
- Add a check: `if (!COMMUNITY_URL.startsWith("https") && !COMMUNITY_URL.includes("localhost")) console.warn(...)`.

### 3. Electron CSP headers

**Problem:** No Content-Security-Policy is configured. A successful XSS can load arbitrary scripts.

**File:** `main.js`

**Fix:**
- Add CSP via `session.defaultSession.webRequest.onHeadersReceived` or a `<meta>` tag in `index.html`:
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  ```

---

## P1 — Audio Accuracy (Tuner)

### 4. Autocorrelation is unnormalized

**Problem:** `autoCorrelate` computes raw (unnormalized) autocorrelation. This makes peak detection amplitude-dependent and increases octave errors. Loud signals produce high values; quiet signals produce low values. The peak comparison is not apples-to-apples across lags.

**File:** `js/audio.js:128-145`

**Fix:** Replace with the YIN algorithm or at minimum normalize the autocorrelation:
- Compute the difference function: `d[tau] = sum((buf[j] - buf[j+tau])^2)`
- Compute the cumulative mean normalized difference: `d'[tau] = d[tau] / ((1/tau) * sum(d[1..tau]))`
- Find the first tau where `d'[tau] < threshold` (typically 0.1-0.15)
- Apply parabolic interpolation on the normalized result
- This eliminates amplitude sensitivity and dramatically reduces octave errors.

### 5. Signal trimming uses a fixed threshold

**Problem:** The trimming logic (`if(Math.abs(buf[i])<0.2)`) uses a hardcoded amplitude threshold that doesn't scale with input level. Quiet signals get entirely trimmed; loud signals aren't trimmed at all.

**File:** `js/audio.js:134-135`

**Fix:**
- Remove the fixed-threshold trimming entirely if using YIN (it's unnecessary).
- If keeping autocorrelation, scale the threshold relative to the signal's RMS: `threshold = rms * 0.5`.

### 6. No octave error detection

**Problem:** The algorithm finds the strongest autocorrelation peak after the first valley but doesn't verify it's the fundamental. Sub-harmonics and harmonics can produce false peaks at 2x or 0.5x the true frequency.

**File:** `js/audio.js:139-141`

**Fix:**
- After finding the peak at lag `mI`, check if the autocorrelation at `2*mI` (half the frequency) is also strong (> 0.8 * c[mI]). If so, use `2*mI` (the lower octave) instead.
- Alternatively, YIN's threshold-based approach naturally avoids this by picking the first valid candidate, not the strongest.

### 7. Parabolic interpolation has no bounds check

**Problem:** The interpolated lag `t - b/(2*a)` can land outside the valid range if `a` is near zero, producing wildly incorrect frequencies.

**File:** `js/audio.js:142-143`

**Fix:**
- Clamp the interpolation shift: `var shift = -b/(2*a); if (Math.abs(shift) > 1) shift = 0; t += shift;`
- Or validate that the result stays within `[mI-1, mI+1]`.

### 8. Minimum RMS threshold is not adaptive

**Problem:** `if(rms<0.01) return -1` — a fixed silence gate with no hysteresis. Notes that decay past this threshold flicker in and out of detection.

**File:** `js/audio.js:132`

**Fix:**
- Add hysteresis: use a higher threshold to start detection (0.015) and a lower one to continue (0.008).
- Store the previous detection state and apply smoothing.

---

## P1 — Audio Accuracy (Chord Detection)

### 9. Fixed FFT amplitude threshold

**Problem:** `dataArray[i] > 130` is an absolute threshold on Uint8Array FFT data [0-255]. Quiet strumming falls below it; ambient noise can exceed it. Detection becomes unreliable outside a narrow volume range.

**File:** `js/audio.js:159`

**Fix:**
- Use a relative threshold: `var maxVal = Math.max(...dataArray); var threshold = maxVal * 0.4;`
- Or compute a noise floor from the average of all bins and set threshold to `noiseFloor + (maxVal - noiseFloor) * 0.3`.

### 10. Peak detection is too simplistic

**Problem:** Checking ±2 bins for a local maximum catches noise spikes (1 bin wide) as easily as real notes. Real musical peaks span 3-10+ bins at fftSize=8192.

**File:** `js/audio.js:159`

**Fix:**
- Require peaks to be local maxima within a wider window (±4-5 bins).
- Add a minimum peak width check: the bin value should be above threshold for at least 2-3 consecutive bins.
- Use parabolic interpolation on FFT peaks for more precise frequency estimation.

### 11. Excessive smoothing causes lag

**Problem:** `smoothingTimeConstant = 0.8` means each FFT frame is 80% old data. Combined with fftSize=8192 (~186ms per frame at 44.1kHz), total latency exceeds 200ms. Chord changes feel sluggish and onsets are invisible.

**File:** `js/audio.js:176`

**Fix:**
- Reduce to `0.3`-`0.4` for faster response.
- Accept more frame-to-frame jitter and handle it with a simple moving average in JS (e.g., require a note to appear in 2 consecutive frames before reporting it).

### 12. Frequency range is too narrow

**Problem:** `if(freq<75||freq>1400) continue` — misses some guitar harmonics above 1400 Hz and the lowest open E (82 Hz) might be borderline.

**File:** `js/audio.js:158`

**Fix:**
- Widen to `60`-`2000` Hz to capture more harmonic content without picking up too much noise.

### 13. No confidence scoring in detection

**Problem:** Notes are either "detected" or "not detected" with no middle ground. A note at 20% confidence is treated the same as one at 95%. This feeds bad data into `getCoachFeedback`, which then gives wrong advice.

**File:** `js/audio.js:150-169`, `js/audio.js:199-234`

**Fix:**
- Return `{note, confidence}` pairs instead of just note names.
- Confidence = peak amplitude relative to the strongest peak in the frame.
- In `getCoachFeedback`, only report a note as "missing" if its confidence is below a threshold (e.g., 0.2), and show "weak" feedback for notes with low confidence (0.2-0.5).

### 14. Coach feedback can misidentify strings

**Problem:** `getCoachFeedback` maps missing notes to strings by note name only, ignoring octave. Since multiple strings can produce the same pitch class (e.g., E appears on strings 1 and 6), it may suggest the wrong string.

**File:** `js/audio.js:214-222`

**Fix:**
- When a note maps to multiple strings, prefer the string that is actually fretted (non-open) or lowest-numbered, since beginners are more likely to have issues with fretted notes.
- Or report both: "Check the E or e string for the E note."

---

## P2 — Rendering & Performance

### 15. Full DOM rebuild on every state change

**Problem:** `render()` sets `app.innerHTML = h` every time, rebuilding the entire DOM. This causes:
- Input fields lose focus and cursor position mid-typing
- Scroll position resets on screen transitions
- Animation frame callbacks (tuner, chord detection, rhythm game) trigger full rebuilds at 60fps

**File:** `js/app.js:801-853`

**Fix (incremental):**
- For high-frequency updates (tuner note, chord match %, rhythm game), update only the specific DOM elements via `getElementById` + `textContent`/`style` changes, similar to how `hdr-xp` and `hdr-str` are already updated.
- Guard `innerHTML` updates: skip if `h === app.innerHTML` or track a dirty flag.
- For input fields, use `oninput` handlers that don't trigger `render()` (some already do this, like `setName`).

**Fix (longer-term):**
- Consider a lightweight virtual DOM diffing approach, or at minimum a per-section update system where each tab/screen has its own container that only re-renders when its data changes.

### 16. Audio node memory leak

**Problem:** `strumChord()` creates oscillator and gain nodes on every call. With rapid strumming, nodes pile up. The `distNode` WaveShaper is also recreated each call but never disconnected.

**File:** `js/audio.js:57-96`

**Fix:**
- Oscillators auto-cleanup after `stop()`, so those are fine.
- Cache the `distNode` — create it once and reuse.
- Optionally, limit concurrent strums (e.g., cancel previous strum if a new one starts within 50ms).

---

## P2 — Bugs

### 17. Strum pattern hardcoded to E Major

**Problem:** `toggleStrum` always plays `strumChord("E Major")` regardless of what chord the user is practicing or what the strum pattern page context is.

**File:** `js/app.js:322-323`

**Fix:**
- Use the current chord: `strumChord(S.currentChord ? S.currentChord.name : "E Major")`.
- Or let the user pick a chord for strum practice and store it in `S.strumChord`.

### 18. Reset + crash = data loss

**Problem:** `resetProgress()` clears localStorage immediately and only re-saves after the 5-second undo timer expires. If the app crashes during the undo window, all progress is permanently lost.

**File:** `js/state.js:106-133`

**Fix:**
- Don't call `localStorage.removeItem` immediately. Instead, save the reset state to a separate key (`chordspark_state_pending_reset`) and only swap it to the main key when the undo timer expires.
- On load, check for a pending reset and offer recovery.

### 19. Rhythm game uses Date.now() for beat timing

**Problem:** `Date.now()` resolution varies across browsers and can drift. For a rhythm game where ±50ms = "perfect", this matters.

**File:** `js/app.js:67-68, 469`

**Fix:**
- Use `performance.now()` instead of `Date.now()` for all rhythm timing calculations. It provides sub-millisecond resolution and is monotonic.

### 20. Stem separation is Windows-only

**Problem:** `demucs.exe` is hardcoded. macOS and Linux users get a confusing error.

**File:** `main.js:92`

**Fix:**
- Use platform detection: `process.platform === "win32" ? "demucs.exe" : "demucs"`.
- Update the error message to include platform-specific instructions.

---

## P3 — Code Quality

### 21. Duplicated timer cleanup

**Problem:** The pattern `clearTimeout(T.session); clearTimeout(T.drill); clearTimeout(T.daily); clearInterval(T.strum); clearInterval(T.song);` appears in `act("tab")`, `act("back")`, and partially elsewhere.

**File:** `js/app.js:183, 785-789`

**Fix:**
- Extract a `stopAllTimers()` function:
  ```js
  function stopAllTimers() {
    clearTimeout(T.session); clearTimeout(T.drill); clearTimeout(T.daily);
    clearInterval(T.strum); clearInterval(T.song); clearInterval(T.metro); clearInterval(T.prog);
    if (S.metronomeOn) stopMetronome();
    if (S.chordDetectOn) stopChordDetect();
    if (S.rhythmActive) { S.rhythmActive = false; if (_rhythmAnim) cancelAnimationFrame(_rhythmAnim); }
    if (S.progPlaying) { S.progPlaying = false; }
    cleanupStems(); S.stemPlaying = false;
  }
  ```
- Call it from `act("tab")` and `act("back")`.

### 22. Inline styles make design inconsistent

**Problem:** Most styling is done via `style=` attributes in HTML string building across `pages.js` (~36k tokens). Colors, padding, font sizes are hardcoded in JS rather than using CSS classes. Changing the design requires editing JS, not CSS.

**File:** `js/pages.js` (throughout)

**Fix (incremental):**
- Extract repeated style patterns into CSS classes. Start with the most common ones:
  - Card headers: `font-size:15px;font-weight:800;color:var(--text-primary)` → `.card-title`
  - Gradient buttons: `background:linear-gradient(135deg,#FF6B6B,#FF8A5C);color:#fff` → `.btn-primary`
  - Stat badges: `background:#FFF3E0;padding:4px 14px;border-radius:20px;...` → `.stat-badge`
- Move color values into CSS custom properties.

### 23. Terse variable names

**Problem:** `S`, `T`, `SCR`, `TAB`, `snd`, `trigC`, `tickS`, `tickD`, `tickDy`, `genQ` — the code reads like minified output.

**Files:** All JS files

**Fix:**
- Rename core identifiers for readability. This is a large diff but straightforward find-and-replace:
  - `S` → `state` (or keep `S` but document it with a comment)
  - `T` → `timers`
  - `snd` → `playSound`
  - `trigC` → `showConfetti`
  - `tickS` → `tickSession`
  - `tickD` → `tickDrill`
  - `tickDy` → `tickDaily`
  - `genQ` → `generateQuizQuestion`

### 24. pages.js is too large

**Problem:** All 12 tab renderers plus all sub-screens are in one ~36k-token file. Hard to navigate and reason about.

**File:** `js/pages.js`

**Fix:**
- Split into separate files per major feature area:
  - `js/pages/practice.js` — practiceTab, sessionPage, completePage
  - `js/pages/drill.js` — drillTab, drillPage, drillDonePage
  - `js/pages/songs.js` — songsTab, songDetailPage, songDonePage, stemsPage
  - `js/pages/stats.js` — statsTab
  - `js/pages/guide.js` — guideTab
  - Keep `js/pages.js` as the router (homePage + imports)
- Add corresponding `<script>` tags in `index.html`.

---

## P3 — Missing Infrastructure

### 25. No tests

**Problem:** Zero test coverage. State logic, chord parsing, autocorrelation, and badge checking are all testable pure functions.

**Fix:**
- Add a lightweight test runner (or just a `test.html` page that runs assertions).
- Priority test targets:
  1. `parseChordSheet` — many edge cases in chord regex
  2. `checkBadges` — combinatorial badge conditions
  3. `autoCorrelate` — feed known sine waves, verify detected frequency
  4. `saveState` / `loadState` — round-trip fidelity
  5. `getTransitionTip` — key lookup and reverse lookup

### 26. No error boundary

**Problem:** If `render()` throws (e.g., due to unexpected state shape after import), the app goes permanently blank with no recovery.

**File:** `js/app.js:801`

**Fix:**
- Wrap `render()` body in try/catch:
  ```js
  function render() {
    try {
      // ... existing render logic
    } catch (e) {
      console.error("Render error:", e);
      document.getElementById("app").innerHTML =
        '<div class="card" style="margin:20px;text-align:center">' +
        '<h2>Something went wrong</h2>' +
        '<button onclick="location.reload()">Reload</button></div>';
    }
  }
  ```
