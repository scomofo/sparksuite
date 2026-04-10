(function() {
  var ROLES = { BASS: "bass", RHYTHM: "rhythm", LEAD: "lead", PERCUSSION: "percussion" };

  function PartClassifier() {}

  PartClassifier.prototype.classify = function(avgFrequency) {
    if (avgFrequency < 200) return ROLES.BASS;
    if (avgFrequency < 2000) return ROLES.RHYTHM;
    return ROLES.LEAD;
  };

  PartClassifier.prototype.classifyStem = function(stemName) {
    if (stemName === "bass") return ROLES.BASS;
    if (stemName === "drums") return ROLES.PERCUSSION;
    if (stemName === "guitar" || stemName === "other") return ROLES.RHYTHM;
    if (stemName === "vocals") return ROLES.LEAD;
    return ROLES.RHYTHM;
  };

  PartClassifier.prototype.classifyFromBuffer = function(audioBuffer, sampleRate) {
    var data = audioBuffer.getChannelData(0);
    var energy = [0, 0, 0]; // low, mid, high
    var chunkSize = 4096;
    var chunks = Math.floor(data.length / chunkSize);
    for (var c = 0; c < Math.min(chunks, 50); c++) {
      for (var i = 0; i < chunkSize; i++) {
        var v = Math.abs(data[c * chunkSize + i]);
        var bin = Math.floor(i / (chunkSize / 3));
        energy[bin] += v;
      }
    }
    if (energy[0] > energy[1] && energy[0] > energy[2]) return ROLES.BASS;
    if (energy[2] > energy[1]) return ROLES.LEAD;
    return ROLES.RHYTHM;
  };

  PartClassifier.ROLES = ROLES;
  window.SparkPartClassifier = PartClassifier;
})();
