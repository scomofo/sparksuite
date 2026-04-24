const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "curriculum", "v2");

const BLOCKS = [
  { type: "warm_engine", duration_sec: 90 },
  { type: "drill", duration_sec: 180 },
  { type: "song", duration_sec: 240 },
  { type: "cooldown", duration_sec: 90 }
];

const COMPLETION_TYPES = new Set(["self_report", "timed", "count", "audio_match", "record_save"]);

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(relativePath, data) {
  const target = path.join(OUT_DIR, relativePath);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function writeJs(relativePath, assignmentTarget, data) {
  const target = path.join(ROOT, relativePath);
  ensureDir(path.dirname(target));
  const source = [
    "(function(){",
    `  window.${assignmentTarget} = ${JSON.stringify(data, null, 2)};`,
    "})();",
    ""
  ].join("\n");
  fs.writeFileSync(target, source, "utf8");
}

function buildBlocks(sessionId) {
  return BLOCKS.map((block) => ({
    type: block.type,
    activity_id: `${sessionId}-${block.type}`,
    duration_sec: block.duration_sec
  }));
}

function completion(type, detail) {
  if (!COMPLETION_TYPES.has(type)) {
    throw new Error(`Unsupported completion type: ${type}`);
  }
  const payload = { type };
  if (detail) payload.detail = detail;
  if (type === "self_report") {
    payload.prompt = "Did this feel playable today?";
  } else if (type === "timed") {
    payload.prompt = `Stay with it for ${detail}.`;
  } else if (type === "count") {
    payload.prompt = `Hit the target: ${detail}.`;
  } else if (type === "record_save") {
    payload.prompt = "Record a take you want to keep.";
  }
  return payload;
}

function session(prefix, instrument, day, title, newElement, songChunk, completionCriteria) {
  const sessionId = `${prefix}-d${String(day).padStart(2, "0")}`;
  const newElements = newElement && newElement !== "none" ? [slugify(newElement)] : [];
  const sessionObj = {
    id: sessionId,
    instrument,
    day,
    title,
    novelty_count: newElements.length,
    new_elements: newElements,
    prerequisites: day > 1 ? [`${prefix}-d${String(day - 1).padStart(2, "0")}`] : [],
    target_duration_min: 10,
    focus_song: songChunk,
    blocks: buildBlocks(sessionId),
    completion_criteria: completionCriteria
  };
  return sessionObj;
}

function inferActivityKind(blockType, sessionRow) {
  const title = sessionRow.title.toLowerCase();
  const element = (sessionRow.new_elements[0] || "").toLowerCase();
  if (blockType === "warm_engine") return "warm_engine_play";
  if (blockType === "cooldown") return sessionRow.novelty_count === 0 ? "review" : "freeplay";
  if (blockType === "song") return "song_chunk";
  if (title.includes("tuning") || element.includes("tuner")) return "tuning";
  if (title.includes("scale") || element.includes("pentatonic") || element.includes("blues-scale")) return "scale_fragment";
  if (title.includes("strum") || title.includes("reggae chuck") || title.includes("palm muting") || title.includes("dynamics")) return "strum_drill";
  if (title.includes("rhythm") || title.includes("quarter") || title.includes("eighth") || title.includes("syncopation") || title.includes("dotted")) return "rhythm_drill";
  if (title.includes("change") || title.includes("switch") || element.includes("change")) return "chord_change_drill";
  if (title.includes("chord") || /^[a-g][#bm0-9\s-]/i.test(sessionRow.title) || element.includes("chord")) return "chord_intro";
  if (sessionRow.novelty_count === 0) return "review";
  return "review";
}

function buildActivities(track) {
  const activities = [];
  track.sessions.forEach((sessionRow) => {
    sessionRow.blocks.forEach((block) => {
      activities.push({
        id: block.activity_id,
        session_id: sessionRow.id,
        instrument: sessionRow.instrument,
        kind: inferActivityKind(block.type, sessionRow),
        block_type: block.type,
        duration_sec: block.duration_sec,
        focus_song: sessionRow.focus_song,
        copy: {
          setup: `${sessionRow.title}. ${block.type.replace(/_/g, " ")} block.`,
          success: `Nice. ${sessionRow.title}.`,
          retry: "Let's loop that."
        }
      });
    });
  });
  return activities;
}

const guitarRows = [
  [1, "First sound in 2 minutes", "open-string strum", "\"Horse\" intro, open strings only", completion("self_report")],
  [2, "How guitars get tuned", "use the tuner", "same", completion("self_report")],
  [3, "The D chord", "D chord shape", "1-chord reggae", completion("count", "8 clean")],
  [4, "D with a drum loop", "D in rhythm", "1-chord pop", completion("timed", "3 min")],
  [5, "The A chord", "A chord shape", "A loop", completion("count", "8 clean")],
  [6, "D to A, slowly", "chord change", "D-A-D-A over drums", completion("count", "4 changes")],
  [7, "The E chord", "E chord shape", "E jam", completion("count", "8 clean")],
  [8, "A-D-E 12-bar blues", "3-chord blues", "simple blues loop", completion("timed", "4 min")],
  [9, "The Em chord", "Em shape", "\"Horse\" full (Em-D6add9)", completion("self_report")],
  [10, "The Am chord", "Am shape", "\"Stand By Me\" (transposed)", completion("self_report")],
  [11, "\"Stand By Me\" full", "put it together", "full verse loop", completion("self_report")],
  [12, "Review and free play", "none", "user picks", completion("self_report")],
  [13, "Down-down-down-down strum", "first strum pattern", "any prior song", completion("timed", "3 min")],
  [14, "The and: downs and ups", "DU alternation", "same", completion("timed", "3 min")],
  [15, "DDU UDU pattern", "classic strum", "\"Stand By Me\"", completion("self_report")],
  [16, "The G chord", "G shape", "\"Knockin'\" intro", completion("count", "8 clean")],
  [17, "The C chord", "C shape", "\"Knockin'\" full (G-D-Am-C)", completion("self_report")],
  [18, "Review and free play", "none", "user picks", completion("self_report")],
  [19, "1-minute changes", "chord-change speed", "metronome-only", completion("count", "30 in 60s")],
  [20, "The Dm chord", "Dm shape", "\"Mad World\" intro", completion("self_report")],
  [21, "G to C fast", "change drill", "song of choice", completion("count", "40 in 60s")],
  [22, "Palm muting", "muted vs open", "any prior song", completion("self_report")],
  [23, "Review and free play", "none", "user picks", completion("self_report")],
  [24, "E minor pentatonic pos. 1", "first scale", "jam over Em loop", completion("timed", "3 min")],
  [25, "Noodle over the blues", "improvise with 6 notes", "A-blues loop", completion("timed", "4 min")],
  [26, "The F cheat chord", "small F", "\"Let It Be\" intro", completion("self_report")],
  [27, "Dynamics: loud and soft", "pick-hand control", "prior song", completion("self_report")],
  [28, "Review and free play", "none", "user picks", completion("self_report")],
  [29, "Prep for showcase", "none", "user's chosen song", completion("self_report")],
  [30, "Showcase day", "record yourself", "user's chosen song", completion("record_save")]
];

const bassRows = [
  [1, "Make one note sound good", "open E pluck", "rock drums at 80 BPM", completion("timed", "3 min")],
  [2, "Tuning the bass", "tuner use", "tuner", completion("self_report")],
  [3, "Quarter notes on E", "steady pulse", "drums at 70", completion("timed", "3 min")],
  [4, "Open A too", "2-string pulse", "drums", completion("timed", "3 min")],
  [5, "E-A groove", "alternating two strings", "rock loop", completion("self_report")],
  [6, "Fretting F on the E string", "first fretted note", "pulse loop", completion("count", "8 clean")],
  [7, "\"Seven Nation Army\" riff (simplified)", "whole-step shape", "the song", completion("self_report")],
  [8, "Eighth notes", "rhythmic subdivision", "same riff doubled", completion("timed", "3 min")],
  [9, "D and G strings", "all 4 strings open", "4-string pulse", completion("self_report")],
  [10, "Walking bassline on opens", "moving pulse", "jazz-ish drum", completion("timed", "3 min")],
  [11, "Review and free play", "none", "user picks", completion("self_report")],
  [12, "The moveable anchor", "right-hand floating thumb", "drills", completion("self_report")],
  [13, "\"Come As You Are\" riff", "chromatic run", "the song", completion("self_report")],
  [14, "Root-5th shape", "interval shape", "I-V in E", completion("timed", "3 min")],
  [15, "Root-5-octave shape", "upper octave", "12-bar in E", completion("self_report")],
  [16, "Minor pentatonic (first 3 notes)", "scale fragment", "E-min vamp", completion("timed", "3 min")],
  [17, "\"Sunshine of Your Love\" intro", "pentatonic in action", "the song", completion("self_report")],
  [18, "Blues scale (6 notes)", "added b5", "12-bar blues", completion("timed", "3 min")],
  [19, "Review and free play", "none", "user picks", completion("self_report")],
  [20, "Sliding between notes", "legato LH", "slide drills", completion("self_report")],
  [21, "\"Another One Bites the Dust\" riff", "iconic disco", "the song", completion("self_report")],
  [22, "Muting with the picking hand", "right-hand mute", "funk loop", completion("timed", "3 min")],
  [23, "Syncopation basics", "off-beat emphasis", "funk groove", completion("timed", "3 min")],
  [24, "Review and free play", "none", "user picks", completion("self_report")],
  [25, "Ghost notes", "percussive mute", "funk", completion("self_report")],
  [26, "Root motion over changes", "following chords", "I-IV-V in A", completion("timed", "4 min")],
  [27, "Improvising over a vamp", "mix pentatonic and groove", "E-min vamp", completion("timed", "4 min")],
  [28, "Review and free play", "none", "user picks", completion("self_report")],
  [29, "Showcase prep", "none", "user's song", completion("self_report")],
  [30, "Showcase day", "record yourself", "user's song", completion("record_save")]
];

const pianoRows = [
  [1, "Find middle C", "keyboard geography", "C 5-finger RH", completion("self_report")],
  [2, "\"Ode to Joy\" (first 4 bars, RH)", "RH melody", "Ode intro", completion("self_report")],
  [3, "Quarter, half, whole", "note durations", "same, with rhythm", completion("timed", "3 min")],
  [4, "LH 5-finger in C", "left hand alone", "C-position LH", completion("self_report")],
  [5, "\"Ode to Joy\" hands-together", "coordinating hands", "Ode full A-section", completion("self_report")],
  [6, "Review and free play", "none", "user picks", completion("self_report")],
  [7, "C-major triad (RH)", "chord shape", "C as a triad", completion("self_report")],
  [8, "\"Amazing Grace\" RH melody", "new melody", "Amazing Grace A", completion("self_report")],
  [9, "F-major triad (RH)", "second chord", "C to F switching", completion("count", "4 changes")],
  [10, "G7 chord (RH)", "4-note chord", "C-F-G7 loop", completion("self_report")],
  [11, "I-IV-V7 in C", "full progression", "over drum loop", completion("timed", "4 min")],
  [12, "Review and free play", "none", "user picks", completion("self_report")],
  [13, "LH root-notes under chords", "bass with chords", "same progression", completion("self_report")],
  [14, "Broken-chord LH pattern", "Alberti-lite", "\"Let It Be\" intro", completion("self_report")],
  [15, "\"Let It Be\" full intro", "application", "LB intro", completion("self_report")],
  [16, "F sharp and the black keys", "first accidental", "G 5-finger position", completion("self_report")],
  [17, "Moving to G position", "key change", "G I-IV-V7", completion("self_report")],
  [18, "Review and free play", "none", "user picks", completion("self_report")],
  [19, "Reading treble clef", "staff reading intro", "sight-read 4 bars", completion("timed", "4 min")],
  [20, "Reading bass clef", "LH staff", "sight-read 4 bars", completion("timed", "4 min")],
  [21, "\"Imagine\" intro (RH)", "classic pop", "Imagine intro", completion("self_report")],
  [22, "\"Imagine\" hands-together", "application", "same, H-T", completion("self_report")],
  [23, "Review and free play", "none", "user picks", completion("self_report")],
  [24, "Dotted quarter-eighth", "new rhythm", "apply to known piece", completion("self_report")],
  [25, "Inversions of C and F", "voice leading", "smoother progression", completion("self_report")],
  [26, "Dynamics", "piano vs forte", "apply to Ode or LB", completion("self_report")],
  [27, "Pedaling (sustain)", "right-foot intro", "apply to Imagine", completion("self_report")],
  [28, "Review and free play", "none", "user picks", completion("self_report")],
  [29, "Showcase prep", "none", "user's piece", completion("self_report")],
  [30, "Showcase day", "record yourself", "user's piece", completion("record_save")]
];

const ukuleleRows = [
  [1, "First strum", "open-string downstrum", "freeplay over reggae loop", completion("self_report")],
  [2, "Tuning the uke", "tuner use", "tuner", completion("self_report")],
  [3, "The C chord", "one-finger chord", "\"Three Little Birds\" chorus", completion("count", "8 clean")],
  [4, "C with a reggae loop", "C in rhythm", "reggae at 90", completion("timed", "3 min")],
  [5, "The Am chord", "two-finger chord", "C to Am drill", completion("count", "4 changes")],
  [6, "The F chord", "two-finger chord", "C-Am-F loop", completion("count", "8 clean")],
  [7, "\"I'm Yours\" simplified", "C-Am-F", "the song", completion("self_report")],
  [8, "The G7 chord", "three-finger", "C-Am-F-G7", completion("count", "8 clean")],
  [9, "\"Stand By Me\" on uke", "full C-Am-F-G7", "the song", completion("self_report")],
  [10, "Review and free play", "none", "user picks", completion("self_report")],
  [11, "Island strum (D-DU-UDU)", "strum pattern", "\"Stand By Me\"", completion("self_report")],
  [12, "The G chord", "three-finger triangle", "\"You Are My Sunshine\"", completion("count", "8 clean")],
  [13, "\"Sunshine\" on uke", "C-F-G", "the song", completion("self_report")],
  [14, "The Em chord", "two-finger", "\"Riptide\" intro", completion("self_report")],
  [15, "\"Riptide\" simplified", "Am-G-C-F", "the song", completion("self_report")],
  [16, "The D chord", "two-finger on 2nd fret", "D-Em-G switching", completion("count", "4 changes")],
  [17, "D7 chord", "variant", "Key-of-G song", completion("self_report")],
  [18, "Review and free play", "none", "user picks", completion("self_report")],
  [19, "1-minute changes", "chord-change speed", "metronome", completion("count", "40 in 60s")],
  [20, "Reggae chuck", "muted upstroke", "\"Three Little Birds\" full", completion("self_report")],
  [21, "\"Three Little Birds\" full", "application", "the song", completion("self_report")],
  [22, "The A7 chord", "useful dominant", "in context", completion("self_report")],
  [23, "Review and free play", "none", "user picks", completion("self_report")],
  [24, "The C7 chord", "dominant variant", "blues-ish vamp", completion("self_report")],
  [25, "Basic 12-bar blues (C7-F7-G7)", "form", "blues loop", completion("timed", "4 min")],
  [26, "Fingerpicking: thumb and index", "RH pattern", "C arpeggio", completion("timed", "3 min")],
  [27, "Fingerpicking 4-pattern", "classic pluck", "\"Over the Rainbow\" intro", completion("self_report")],
  [28, "Review and free play", "none", "user picks", completion("self_report")],
  [29, "Showcase prep", "none", "user's song", completion("self_report")],
  [30, "Showcase day", "record yourself", "user's song", completion("record_save")]
];

const tracks = [
  {
    instrument: "guitar",
    prefix: "gtr",
    title: "Guitar 30-Day ADHD-First Track",
    required_chords: ["A", "Am", "D", "Dm", "E", "Em", "G", "C", "F-easy", "F-full", "A7", "D7", "E7", "G7"],
    required_scales: ["E-minor-pentatonic-pos-1", "A-minor-pentatonic-pos-1", "C-major-scale-open"],
    required_songs: ["Horse With No Name", "Stand By Me", "Knockin' on Heaven's Door", "Mad World", "Let It Be intro", "Seven Nation Army"],
    sessions: guitarRows.map((row) => session("gtr", "guitar", row[0], row[1], row[2], row[3], row[4]))
  },
  {
    instrument: "bass",
    prefix: "bass",
    title: "Bass 30-Day ADHD-First Track",
    required_notes_and_scales: [
      "All fretted notes on E and A strings up to fret 7",
      "Open D and G",
      "E-minor pentatonic (one-octave position)",
      "E blues scale (one-octave)",
      "Root-5-octave movable pattern"
    ],
    required_songs: ["Seven Nation Army", "Come As You Are", "Sunshine of Your Love", "Another One Bites the Dust", "12-bar blues in E", "funk vamp in E"],
    sessions: bassRows.map((row) => session("bass", "bass", row[0], row[1], row[2], row[3], row[4]))
  },
  {
    instrument: "piano",
    prefix: "pno",
    title: "Piano 30-Day ADHD-First Track",
    required_chords: ["C-major", "F-major", "G7", "Am", "Dm", "Em", "C-major-first-inversion", "F-major-first-inversion"],
    required_pieces: ["Ode to Joy", "Amazing Grace", "Let It Be intro", "Imagine intro", "Twinkle Twinkle"],
    sessions: pianoRows.map((row) => session("pno", "piano", row[0], row[1], row[2], row[3], row[4]))
  },
  {
    instrument: "ukulele",
    prefix: "uke",
    title: "Ukulele 30-Day ADHD-First Track",
    required_chords: ["C", "Am", "F", "G7", "G", "Em", "D", "Dm", "D7", "A7", "C7", "F7"],
    required_songs: ["Three Little Birds", "Stand By Me", "I'm Yours", "You Are My Sunshine", "Riptide", "Over the Rainbow"],
    sessions: ukuleleRows.map((row) => session("uke", "ukulele", row[0], row[1], row[2], row[3], row[4]))
  }
];

const catalog = {
  version: "2026-04-24",
  format: "sparksuite-curriculum-v2",
  principles: {
    adhd_first: true,
    session_shell_blocks: ["warm_engine", "drill", "song", "cooldown"],
    make_sound_in_seconds: 5,
    novelty_cap_per_session: 1,
    rotate_micro_activities_minutes: "3-5",
    cumulative_progress_only: true,
    no_negative_failure_feedback: true
  },
  tracks: tracks.map((track) => ({
    instrument: track.instrument,
    title: track.title,
    session_count: track.sessions.length,
    track_file: `tracks/${track.instrument}-30day.json`,
    activity_file: `activities/${track.instrument}-30day.activities.json`
  }))
};

const runtimeTracks = [];

tracks.forEach((track) => {
  runtimeTracks.push({
    instrument: track.instrument,
    title: track.title,
    session_count: track.sessions.length,
    sessions: track.sessions
  });
  writeJson(`tracks/${track.instrument}-30day.json`, {
    version: catalog.version,
    instrument: track.instrument,
    title: track.title,
    session_count: track.sessions.length,
    sessions: track.sessions,
    required_chords: track.required_chords || [],
    required_scales: track.required_scales || [],
    required_notes_and_scales: track.required_notes_and_scales || [],
    required_songs: track.required_songs || [],
    required_pieces: track.required_pieces || []
  });
  writeJson(`activities/${track.instrument}-30day.activities.json`, {
    version: catalog.version,
    instrument: track.instrument,
    activity_count: track.sessions.length * BLOCKS.length,
    activities: buildActivities(track)
  });
});

writeJson("catalog.json", catalog);
writeJs(path.join("js", "curriculum", "curriculum_v2_data.generated.js"), "SparkCurriculumV2Data", {
  version: catalog.version,
  format: catalog.format,
  principles: catalog.principles,
  tracks: runtimeTracks
});

console.log(`Generated SparkSuite Phase 1 curriculum data in ${OUT_DIR}`);
