var assert = require("assert");
var fs = require("fs");
var path = require("path");

function loadJS(file) {
  return fs.readFileSync(path.join(__dirname, "..", file), "utf8");
}

function test(name, fn) {
  try {
    global.window = global;
    global.Audio = function() {};
    global.CHORD_NOTES = { "A Minor": ["A", "C", "E"] };
    global.S = { strumTone: "classic", soundOn: true };
    global.SparkInstruments = {
      getActive: function() {
        return {
          instrument: "ukulele",
          getData: function() {
            return {
              CHORD_NOTES: {
                Am: ["A", "C", "E"],
                C: ["C", "E", "G"]
              }
            };
          }
        };
      }
    };
    global.eval(loadJS("js/audio.js"));
    fn();
    console.log("  PASS: " + name);
  } catch (err) {
    console.error("  FAIL: " + name);
    console.error("    " + err.message);
    process.exitCode = 1;
  }
}

console.log("\n--- Audio Instrument Chord Notes ---");

test("strum preview resolves active instrument chord-note aliases before global guitar names", function() {
  assert.deepStrictEqual(resolveStrumChordNotes("Am"), ["A", "C", "E"]);
});
