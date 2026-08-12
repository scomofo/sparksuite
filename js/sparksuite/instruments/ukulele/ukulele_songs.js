(function() {
  window.SparkUkuleleSongs = {
    song_uke_c_pulse_01: {
      id: "song_uke_c_pulse_01", instrument: "ukulele", title: "Uke C Pulse",
      lessonIds: ["lesson_uke_c_chord_01"], level: 1, tags: ["chord"]
    },
    song_uke_c_am_easy_01: {
      id: "song_uke_c_am_easy_01", instrument: "ukulele", title: "Uke C Am Easy",
      lessonIds: ["lesson_uke_first_two_chord_song_01"], level: 2, tags: ["song"]
    },
    song_uke_c_am_f_g7_loop_01: {
      id: "song_uke_c_am_f_g7_loop_01", instrument: "ukulele", title: "Uke C Am F G7 Loop",
      lessonIds: ["lesson_uke_four_chord_loop_01"], level: 3, tags: ["progression"]
    },
    song_uke_island_loop_01: {
      id: "song_uke_island_loop_01", instrument: "ukulele", title: "Uke Island Loop",
      lessonIds: ["lesson_uke_island_strum_01"], level: 3, tags: ["rhythm","style"]
    },
    song_uke_three_chord_01: {
      id: "song_uke_three_chord_01", instrument: "ukulele", title: "Uke Three Chord",
      lessonIds: ["lesson_uke_song_3_chord_01"], level: 3, tags: ["song"]
    },
    song_uke_four_chord_01: {
      id: "song_uke_four_chord_01", instrument: "ukulele", title: "Uke Four Chord",
      lessonIds: ["lesson_uke_song_4_chord_01"], level: 4, tags: ["song"]
    },
    song_uke_simple_melody_01: {
      id: "song_uke_simple_melody_01", instrument: "ukulele", title: "Uke Simple Melody",
      lessonIds: ["lesson_uke_simple_melody_01"], level: 4, tags: ["melody"]
    },
    set_uke_beginner_plus_01: {
      id: "set_uke_beginner_plus_01", instrument: "ukulele", title: "Uke Beginner Plus",
      lessonIds: ["lesson_uke_performance_set_01"], level: 6, tags: ["performance"]
    }
  };

  // Repertoire list rendered by the song-picker UI.
  window.SparkUkuleleRepertoire = [
    { title: "Island Loop", artist: "SparkSuite", progression: ["C", "Am", "F", "G"], bpm: 78, focus: "steady island groove" },
    { title: "Sunset Switches", artist: "SparkSuite", progression: ["F", "G", "Em", "Am"], bpm: 74, focus: "clean chord changes" },
    { title: "Palm Arpeggio", artist: "SparkSuite", progression: ["C", "G", "Am", "F"], bpm: 68, focus: "fingerpicked flow" },
    { title: "Moonlit Picking", artist: "SparkSuite", progression: ["Am", "F", "C", "G"], bpm: 72, focus: "steady arpeggio motion" },
    { title: "Somewhere Over the Rainbow", artist: "IZ", progression: ["C", "Em", "Am", "F"], bpm: 80, focus: "gentle fingerpick flow" },
    { title: "Riptide", artist: "Vance Joy", progression: ["Am", "G", "C", "F"], bpm: 102, focus: "quick strum changes" },
    { title: "I'm Yours", artist: "Jason Mraz", progression: ["C", "G", "Am", "F"], bpm: 76, focus: "relaxed island groove" },
    { title: "Hey Soul Sister", artist: "Train", progression: ["C", "G", "Am", "F"], bpm: 97, focus: "upbeat strumming" },
    { title: "Can't Help Falling in Love", artist: "Elvis", progression: ["C", "Em", "Am", "F", "G"], bpm: 72, focus: "slow waltz feel" },
    { title: "Count on Me", artist: "Bruno Mars", progression: ["C", "Em", "Am", "G"], bpm: 88, focus: "happy fingerpick" },
    { title: "Lava", artist: "Disney", progression: ["C", "G7", "F"], bpm: 76, focus: "simple 3-chord island" },
    { title: "Stand By Me", artist: "Ben E. King", progression: ["C", "Am", "F", "G"], bpm: 120, focus: "steady bass strum" },
    { title: "Three Little Birds", artist: "Bob Marley", progression: ["C", "F", "G7"], bpm: 76, focus: "relaxed reggae chuck" },
    { title: "You Are My Sunshine", artist: "Traditional country", progression: ["C", "F", "G7"], bpm: 100, focus: "steady down-strum sing-along" }
  ];
})();
