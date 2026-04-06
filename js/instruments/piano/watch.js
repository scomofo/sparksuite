// js/instruments/piano/watch.js
// Piano-specific Watch & Shadow phase implementations.
// Provides: window.PianoWatch

(function() {
  "use strict";

  var PIANO_FINGER_LABELS = {1:"Thumb", 2:"Index", 3:"Middle", 4:"Ring", 5:"Pinky"};

  function getFingerNumbers(noteCount) {
    if (noteCount === 3) return [1, 3, 5];
    if (noteCount === 4) return [1, 2, 3, 5];
    if (noteCount === 5) return [1, 2, 3, 4, 5];
    var fingers = [];
    for (var i = 0; i < noteCount; i++) fingers.push(i + 1);
    return fingers;
  }

  function watchAnimation(container, chordObj, options) {
    if (!container || !chordObj) return { cleanup: function() {} };
    options = options || {};
    if (typeof WatchCommon !== "undefined") WatchCommon.ensureCSS();

    var midis = (typeof chordMidi === "function") ? chordMidi(chordObj) : [];
    var names = (typeof chordNoteNames === "function") ? chordNoteNames(chordObj) : [];
    var fingers = getFingerNumbers(midis.length);

    var svgWrap = document.createElement("div");
    svgWrap.style.textAlign = "center";
    svgWrap.innerHTML = (typeof pianoSVG === "function") ? pianoSVG(null, { width: 340, hideKeys: true }) : "";
    container.appendChild(svgWrap);

    var narration = document.createElement("div");
    narration.className = "watch-narration";
    narration.textContent = "Watch the keys...";
    container.appendChild(narration);

    var svgEl = svgWrap.querySelector("svg");
    if (!svgEl) return { cleanup: function() { container.innerHTML = ""; } };

    var allSteps = [];
    midis.forEach(function(midi, idx) {
      allSteps.push(function() {
        var keyEl = svgEl.querySelector("[data-midi=\x27" + midi + "\x27]");
        if (keyEl) {
          keyEl.setAttribute("fill", chordObj.color || "#FF6B6B");
          keyEl.style.animation = "keyPress 0.4s ease both";
        }
        var fingerNum = fingers[idx] || (idx + 1);
        var fingerName = PIANO_FINGER_LABELS[fingerNum] || ("Finger " + fingerNum);
        var noteName = names[idx] || ("note " + midi);
        narration.textContent = fingerName + " (finger " + fingerNum + ") plays " + noteName;
      });
    });

    allSteps.push(function() {
      if (typeof options.strumFn === "function") options.strumFn();
      narration.textContent = "";
      var btnRow = document.createElement("div");
      btnRow.className = "watch-btn-row";
      var againBtn = document.createElement("button");
      againBtn.className = "watch-btn watch-btn-secondary";
      againBtn.textContent = "Watch Again";
      againBtn.addEventListener("click", function() {
        var keys = svgEl.querySelectorAll(".piano-key");
        keys.forEach(function(k) {
          if (k.classList.contains("piano-black")) {
            k.setAttribute("fill", "#222");
          } else {
            k.setAttribute("fill", "#fff");
          }
          k.style.animation = "";
        });
        btnRow.remove();
        seq = WatchCommon.animateSequence(allSteps, 800);
      });
      btnRow.appendChild(againBtn);
      var gotItBtn = document.createElement("button");
      gotItBtn.className = "watch-btn watch-btn-primary";
      gotItBtn.textContent = "Got It";
      gotItBtn.addEventListener("click", function() {
        if (typeof options.onComplete === "function") options.onComplete();
      });
      btnRow.appendChild(gotItBtn);
      container.appendChild(btnRow);
    });

    var seq = WatchCommon.animateSequence(allSteps, 800);
    return {
      cleanup: function() {
        seq.cancel();
        container.innerHTML = "";
      }
    };
  }

  function shadowQuiz(container, chordObj, options) {
    if (!container || !chordObj) return { cleanup: function() {} };
    options = options || {};
    if (typeof WatchCommon !== "undefined") WatchCommon.ensureCSS();

    var midis = (typeof chordMidi === "function") ? chordMidi(chordObj) : [];
    var names = (typeof chordNoteNames === "function") ? chordNoteNames(chordObj) : [];
    var fingers = getFingerNumbers(midis.length);

    // Sort low to high
    var sortedMidis = midis.slice().sort(function(a, b) { return a - b; });

    var svgWrap = document.createElement("div");
    svgWrap.style.textAlign = "center";
    svgWrap.innerHTML = (typeof pianoSVG === "function") ? pianoSVG(null, { width: 340, hideKeys: false }) : "";
    container.appendChild(svgWrap);

    var prompt = document.createElement("div");
    prompt.className = "watch-prompt";
    container.appendChild(prompt);

    var svgEl = svgWrap.querySelector("svg");
    if (!svgEl) return { cleanup: function() { container.innerHTML = ""; } };

    if (sortedMidis.length === 0) {
      prompt.textContent = "No notes to practice.";
      return { cleanup: function() { container.innerHTML = ""; } };
    }

    var currentIdx = 0;
    var cancelled = false;

    function showPrompt() {
      if (currentIdx >= sortedMidis.length) return;
      var midiVal = sortedMidis[currentIdx];
      var origIdx = midis.indexOf(midiVal);
      var fingerNum = fingers[origIdx] || (origIdx + 1);
      var fingerName = PIANO_FINGER_LABELS[fingerNum] || ("Finger " + fingerNum);
      prompt.textContent = "Tap " + fingerName.toLowerCase() + " (finger " + fingerNum + ")";
    }

    function handleClick(e) {
      if (cancelled || currentIdx >= sortedMidis.length) return;
      var target = e.target;
      if (!target.classList.contains("piano-key")) return;
      var clickedMidi = parseInt(target.getAttribute("data-midi"), 10);
      var expectedMidi = sortedMidis[currentIdx];

      if (clickedMidi === expectedMidi) {
        target.setAttribute("fill", chordObj.color || "#FF6B6B");
        target.style.animation = "keyPress 0.3s ease both";
        var origIdx = midis.indexOf(expectedMidi);
        var fingerNum = fingers[origIdx] || (origIdx + 1);
        // Add finger label below key
        var ns = "http://www.w3.org/2000/svg";
        var bbox = target.getBBox();
        var label = document.createElementNS(ns, "text");
        label.setAttribute("x", bbox.x + bbox.width / 2);
        label.setAttribute("y", bbox.y + bbox.height + 14);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("font-size", "11");
        label.setAttribute("fill", "var(--text-primary, #eee)");
        label.setAttribute("font-weight", "bold");
        label.textContent = fingerNum;
        svgEl.appendChild(label);

        currentIdx++;
        if (currentIdx >= sortedMidis.length) {
          prompt.textContent = "";
          WatchCommon.celebrateIn(container);
          var btnRow = document.createElement("div");
          btnRow.className = "watch-btn-row";
          var continueBtn = document.createElement("button");
          continueBtn.className = "watch-btn watch-btn-primary";
          continueBtn.textContent = "Continue";
          continueBtn.addEventListener("click", function() {
            if (typeof options.onComplete === "function") options.onComplete();
          });
          btnRow.appendChild(continueBtn);
          container.appendChild(btnRow);
        } else {
          showPrompt();
        }
      } else {
        WatchCommon.shakeElement(svgWrap);
      }
    }

    svgEl.addEventListener("click", handleClick);
    showPrompt();

    return {
      cleanup: function() {
        cancelled = true;
        svgEl.removeEventListener("click", handleClick);
        container.innerHTML = "";
      }
    };
  }

  window.PianoWatch = {
    watchAnimation: watchAnimation,
    shadowQuiz: shadowQuiz
  };

})();
