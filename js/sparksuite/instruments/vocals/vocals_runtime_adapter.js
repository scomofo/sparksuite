(function() {
  // Vocals runtime is mic-pitch-first. Lanes map to scale-degree pitch
  // zones rather than strings/keys; the renderer is expected to use a
  // pitch-lane highway with five horizontal lanes (do/re/mi/sol/high).
  window.SparkVocalsRuntimeAdapter = {
    instrument: "vocals",
    createPlayableEvents: function(exercise) {
      return (exercise && exercise.events) || [];
    },
    getDefaultInputMode: function() {
      return "microphone_pitch";
    },
    getPitchLanes: function() {
      return [
        { id: "lane_low",    degree: 1, label: "do",  semitones: 0  },
        { id: "lane_low_mid",degree: 2, label: "re",  semitones: 2  },
        { id: "lane_mid",    degree: 3, label: "mi",  semitones: 4  },
        { id: "lane_high_mid",degree: 5, label: "sol",semitones: 7  },
        { id: "lane_high",   degree: 6, label: "la",  semitones: 9  }
      ];
    },
    getRangeProfile: function(profile) {
      var p = String(profile || "comfort_mid").toLowerCase();
      if (p === "comfort_low")  return { rootMidi: 55, label: "G3 root" };  // G3
      if (p === "comfort_high") return { rootMidi: 67, label: "G4 root" };  // G4
      return { rootMidi: 60, label: "C4 root" };                            // C4 mid default
    }
  };
})();
