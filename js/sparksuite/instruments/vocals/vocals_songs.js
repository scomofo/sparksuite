(function() {
  window.SparkVocalsSongs = {
    song_vocal_call_response_01:     { id: "song_vocal_call_response_01",     instrument: "vocals", title: "Vocal Call Response",      lessonIds: ["lesson_vocal_first_call_response_01"], level: 1, tags: ["pitch","response"] },
    song_vocal_short_phrase_01:      { id: "song_vocal_short_phrase_01",      instrument: "vocals", title: "Vocal Short Phrase",       lessonIds: ["lesson_vocal_song_short_phrase_01"],   level: 3, tags: ["song"] },
    song_vocal_verse_chorus_easy_01: { id: "song_vocal_verse_chorus_easy_01", instrument: "vocals", title: "Vocal Verse Chorus Easy",  lessonIds: ["lesson_vocal_song_verse_chorus_01"],   level: 4, tags: ["song"] },
    song_vocal_full_easy_01:         { id: "song_vocal_full_easy_01",         instrument: "vocals", title: "Vocal Full Easy",           lessonIds: ["lesson_vocal_full_easy_song_01"],      level: 5, tags: ["performance"] },
    set_vocal_beginner_plus_01:      { id: "set_vocal_beginner_plus_01",      instrument: "vocals", title: "Vocal Beginner Plus",       lessonIds: ["lesson_vocal_performance_set_01"],     level: 6, tags: ["performance"] }
  };

  // Repertoire kept simple — vocal coverage focuses on melodic, narrow-range,
  // forgiving-tempo songs so adult ADHD learners reach a payoff fast.
  window.SparkVocalsRepertoire = [
    { title: "Twinkle Twinkle",          artist: "Trad.",            keyCenter: "C", bpm: 80,  focus: "stepwise pitch matching" },
    { title: "Happy Birthday",           artist: "Trad.",            keyCenter: "C", bpm: 90,  focus: "narrow range, quick win" },
    { title: "Stand By Me",              artist: "Ben E. King",      keyCenter: "A", bpm: 120, focus: "verse-chorus phrasing" },
    { title: "Lean On Me",               artist: "Bill Withers",     keyCenter: "C", bpm: 90,  focus: "stepwise melody, easy range" },
    { title: "Three Little Birds",       artist: "Bob Marley",       keyCenter: "A", bpm: 76,  focus: "easy phrases, repeated lines" },
    { title: "Hallelujah",               artist: "Leonard Cohen",    keyCenter: "C", bpm: 80,  focus: "phrase timing, breath control" }
  ];
})();
