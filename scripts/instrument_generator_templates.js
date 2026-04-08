module.exports = {
  fretted: {
    baseSkills: [
      { id: "basic_strum", category: "rhythm", label: "Basic Strum" },
      { id: "basic_chords", category: "chords", label: "Basic Chords" }
    ],
    lesson: (id) => ({ id: `${id}_01`, skill: "basic_strum", prerequisites: [] }),
    exercise: (id) => ({ id: `${id}_basic_01`, type: "strum", pattern: "D D D D", durationSec: 60 }),
    extras: ['tuning']
  },
  keys: {
    baseSkills: [
      { id: "basic_keys", category: "fundamentals", label: "Basic Keys" }
    ],
    lesson: (id) => ({ id: `${id}_01`, skill: "basic_keys", prerequisites: [] }),
    exercise: (id) => ({ id: `${id}_basic_01`, type: "melody_line", notes: ["C4","E4","G4"], durationSec: 60 }),
    extras: []
  },
  drums: {
    baseSkills: [
      { id: "basic_groove", category: "rhythm", label: "Basic Groove" }
    ],
    lesson: (id) => ({ id: `${id}_01`, skill: "basic_groove", prerequisites: [] }),
    exercise: (id) => ({ id: `${id}_basic_01`, type: "pattern", pattern: "K S K S", durationSec: 60 }),
    extras: []
  }
};