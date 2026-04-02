// js/instruments/piano/data.js
// Piano-specific data — placeholder for full PianoSpark data port
(function() {
  // Piano songs will be populated from PianoSpark's data.js
  if (typeof window.PIANO_SONGS === "undefined") {
    window.PIANO_SONGS = [];
  }

  // Piano voicings — full set from PianoSpark
  if (typeof window.PIANO_VOICINGS === "undefined") {
    window.PIANO_VOICINGS = {};
  }
})();
