(function() {
  window.SparkGuitarSongs = {
    song_guitar_open_string_groove_01: { id: "song_guitar_open_string_groove_01", instrument: "guitar", title: "Open String Groove",  lessonIds: ["lesson_guitar_first_riff_01"],            level: 1, tags: ["riff","performance"] },
    song_guitar_em_pulse_01:           { id: "song_guitar_em_pulse_01",           instrument: "guitar", title: "Em Pulse",             lessonIds: ["lesson_guitar_em_chord_01"],              level: 1, tags: ["chord"] },
    song_guitar_cgdam_loop_01:         { id: "song_guitar_cgdam_loop_01",         instrument: "guitar", title: "C-G-D-Am Loop",        lessonIds: ["lesson_guitar_four_chord_loop_01"],       level: 3, tags: ["progression","song"] },
    song_guitar_pop_pattern_01:        { id: "song_guitar_pop_pattern_01",        instrument: "guitar", title: "Pop Pattern",          lessonIds: ["lesson_guitar_strum_pattern_pop_01"],     level: 3, tags: ["rhythm","pattern"] },
    song_guitar_two_chord_easy_01:     { id: "song_guitar_two_chord_easy_01",     instrument: "guitar", title: "Two-Chord Easy",       lessonIds: ["lesson_guitar_song_first_two_chord_01"],  level: 2, tags: ["song"] },
    song_guitar_four_chord_easy_01:    { id: "song_guitar_four_chord_easy_01",    instrument: "guitar", title: "Four-Chord Easy",      lessonIds: ["lesson_guitar_song_four_chord_01"],       level: 3, tags: ["song"] },
    song_guitar_full_easy_01:          { id: "song_guitar_full_easy_01",          instrument: "guitar", title: "Full Easy Run",        lessonIds: ["lesson_guitar_song_full_easy_01"],        level: 4, tags: ["performance"] },
    set_guitar_beginner_plus_01:       { id: "set_guitar_beginner_plus_01",       instrument: "guitar", title: "Guitar Beginner Plus", lessonIds: ["lesson_guitar_performance_set_01"],       level: 6, tags: ["performance"] }
  };

  // Cover-list rendered by the songs UI; kept separate from curriculum song refs.
  window.SparkGuitarRepertoire = [
    { title: "Wonderwall",          artist: "Oasis",            progression: ["Em7","G","D","C"],           bpm: 87,  focus: "open-chord strum" },
    { title: "Knockin' on Heaven's Door", artist: "Bob Dylan",  progression: ["G","D","Am"],                 bpm: 72,  focus: "two-chord plus turnaround" },
    { title: "Horse with No Name",  artist: "America",          progression: ["Em","D6/9"],                  bpm: 122, focus: "two-chord groove" },
    { title: "Last Kiss",           artist: "Pearl Jam",        progression: ["G","Em","C","D"],             bpm: 80,  focus: "doo-wop loop" },
    { title: "Three Little Birds",  artist: "Bob Marley",       progression: ["A","D","E"],                  bpm: 76,  focus: "three-chord reggae feel" },
    { title: "Brown Eyed Girl",     artist: "Van Morrison",     progression: ["G","C","D","Em"],             bpm: 150, focus: "rolling strum" },
    { title: "Bad Moon Rising",     artist: "CCR",              progression: ["D","A","G"],                  bpm: 180, focus: "down-up strum" },
    { title: "Hey Joe",             artist: "Jimi Hendrix",     progression: ["C","G","D","A","E"],          bpm: 75,  focus: "circle-of-fifths walk" },
    { title: "Free Fallin'",        artist: "Tom Petty",        progression: ["D","G","D","A"],              bpm: 85,  focus: "steady eighths" },
    { title: "Sweet Home Alabama",  artist: "Lynyrd Skynyrd",   progression: ["D","C","G"],                  bpm: 100, focus: "three-chord rock" },
    { title: "Zombie",              artist: "The Cranberries",  progression: ["Em","C","G","D"],             bpm: 86,  focus: "minor-key drive" },
    { title: "Time of Your Life",   artist: "Green Day",        progression: ["G","Cadd9","Dsus4"],          bpm: 95,  focus: "fingerpicked open chords" }
  ];
})();
