(function() {
  function ChartIO(options) {
    options = options || {};
    this.performanceMonitor = options.performanceMonitor
      || (typeof window !== "undefined" && window.sparkCore ? window.sparkCore.performanceMonitor : null)
      || null;
  }

  ChartIO.prototype.setPerformanceMonitor = function(performanceMonitor) {
    this.performanceMonitor = performanceMonitor || null;
    return this;
  };

  ChartIO.prototype.measureChartLoad = function(label, fn) {
    if (this.performanceMonitor && typeof this.performanceMonitor.measure === "function") {
      return this.performanceMonitor.measure(label, "chartLoadMs", fn);
    }
    return fn();
  };

  ChartIO.prototype.fromExerciseDefinition = function(definition, adapter) {
    var self = this;
    return this.measureChartLoad("chart.load.exercise_definition", function() {
      definition = definition || {};
      var ppq = definition.ppq || 480;
      var bpm = definition.bpm || 100;
      var tempoMap = new SparkTempoMap({ ppq: ppq, bpm: bpm });
      var notes = [];
      var phrases = [];

      var rawNotes = Array.isArray(definition.notes) ? definition.notes : [];
      for (var i = 0; i < rawNotes.length; i++) {
        var row = rawNotes[i];
        notes.push(new SparkNoteEvent({
          id: row.id || ("evt_" + (i + 1)),
          tick: Math.round((row.beat || 0) * ppq),
          tickLength: Math.round((row.lengthBeats || 0) * ppq),
          laneMask: row.laneMask || 0,
          flags: row.flags || {},
          difficulty: definition.difficulty || "easy",
          instrument: "guitar",
          label: row.label || "",
          skillId: row.skillId || null
        }));
      }

      var rawPhrases = Array.isArray(definition.phrases) ? definition.phrases : [];
      for (var j = 0; j < rawPhrases.length; j++) {
        var phrase = rawPhrases[j];
        phrases.push(new SparkPhrase({
          id: phrase.id,
          name: phrase.name,
          startTick: Math.round((phrase.startBeat || 0) * ppq),
          endTick: Math.round((phrase.endBeat || 0) * ppq),
          flags: phrase.flags || {}
        }));
      }

      return new SparkSongChart({
        song: {
          id: definition.id,
          title: definition.title || definition.id || "Rhythm Exercise",
          artist: definition.artist || "SparkSuite",
          durationSec: definition.durationSec || ((definition.totalBeats || 16) * (60 / bpm))
        },
        tempoMap: tempoMap,
        tracks: {
          guitar: {
            notes: notes,
            phrases: phrases
          }
        },
        metadata: {
          sourceFormat: "spark_exercise_v1",
          laneCount: adapter && adapter.getLaneCount ? adapter.getLaneCount() : 5,
          chartId: definition.id,
          enginePreset: definition.enginePreset || "spark_learning"
        }
      });
    });
  };

  ChartIO.prototype.fromNotesChart = function(chartText, adapter, options) {
    return this.measureChartLoad("chart.load.notes_chart", function() {
      options = options || {};
      var sections = parseChartSections(chartText || "");
      var iniMeta = parseSongIni(options.songIni || "");
      var songMeta = parseSongSection(sections.Song || [], iniMeta);
      var syncMeta = parseSyncTrack(sections.SyncTrack || [], songMeta.ppq);
      var notesMeta = parseNoteTrack(selectNoteTrack(sections, options.trackName), songMeta.ppq);
      var phrases = buildPhrases(notesMeta, songMeta.ppq);
      var durationSec = syncMeta.tempoMap.tickToSeconds(notesMeta.lastTickEnd);

      return new SparkSongChart({
        song: {
          id: songMeta.id,
          title: songMeta.title,
          artist: songMeta.artist,
          charter: songMeta.charter,
          offsetSec: songMeta.offsetSec,
          durationSec: Math.max(songMeta.durationSec || 0, durationSec + songMeta.offsetSec)
        },
        tempoMap: syncMeta.tempoMap,
        tracks: {
          guitar: {
            notes: notesMeta.notes,
            phrases: phrases
          }
        },
        metadata: {
          sourceFormat: "notes_chart_v1",
          laneCount: adapter && adapter.getLaneCount ? adapter.getLaneCount() : 5,
          chartId: songMeta.id,
          enginePreset: options.enginePreset || "spark_learning",
          trackName: notesMeta.trackName,
          timeSignatures: syncMeta.timeSignatures
        }
      });
    });
  };

  ChartIO.prototype.fromMidiBuffer = function(buffer, adapter, options) {
    return this.measureChartLoad("chart.load.midi_buffer", function() {
      options = options || {};
      var laneCount = adapter && adapter.getLaneCount ? adapter.getLaneCount() : 5;
      var iniMeta = parseSongIni(options.songIni || "");
      var midiMeta = parseMidiBuffer(buffer);
      var selectedTrack = selectMidiTrack(midiMeta.tracks, options);
      var selectedNotes = filterMidiTrackNotes(selectedTrack, options);
      var tempoMap = new SparkTempoMap({
        ppq: midiMeta.ppq,
        segments: midiMeta.tempoSegments.length ? midiMeta.tempoSegments : [{ tick: 0, bpm: 120 }]
      });
      var noteEvents = buildMidiLaneEvents(selectedNotes, laneCount);
      var lastTickEnd = getLastTickEnd(selectedNotes) || selectedTrack.lastTickEnd || midiMeta.lastTickEnd || 0;
      var chartId = iniMeta.id || toChartId(options.title || selectedTrack.name || "imported_midi");

      return new SparkSongChart({
        song: {
          id: chartId,
          title: iniMeta.name || options.title || selectedTrack.name || "Imported MIDI",
          artist: iniMeta.artist || options.artist || "Unknown Artist",
          charter: iniMeta.charter || "",
          offsetSec: numberOr(iniMeta.offset, 0),
          durationSec: Math.max(numberOr(iniMeta.duration, 0), tempoMap.tickToSeconds(lastTickEnd))
        },
        tempoMap: tempoMap,
        tracks: {
          guitar: {
            notes: noteEvents,
            phrases: buildMidiPhrases(selectedTrack.markers, lastTickEnd, midiMeta.ppq)
          }
        },
        metadata: {
          sourceFormat: "notes_mid_v1",
          laneCount: laneCount,
          chartId: chartId,
          enginePreset: options.enginePreset || "spark_learning",
          trackName: selectedTrack.name || options.trackName || "midi",
          trackIndex: selectedTrack.index,
          selectedChannels: getAvailableChannels(selectedNotes),
          availableChannels: selectedTrack.channels,
          sourceTrackCount: midiMeta.tracks.length,
          midiFormat: midiMeta.format,
          timeSignatures: midiMeta.timeSignatures,
          // Last tick across ALL tracks/channels — the selected track can end
          // earlier than the full arrangement the backing player renders.
          midiLastTickEnd: midiMeta.lastTickEnd
        }
      });
    });
  };

  // Raw multi-track parse for callers (e.g. the MIDI import flow) that need
  // every track's notes, tempo segments, and time signatures rather than a
  // built SongChart for a single selected track.
  ChartIO.prototype.parseMidiRaw = function(buffer) {
    return parseMidiBuffer(buffer);
  };

  ChartIO.prototype.fromPackage = function(pkg, adapter, options) {
    var self = this;
    return this.measureChartLoad("chart.load.package", function() {
      options = mergeImportOptions(options, pkg && pkg.options);
      var files = normalizePackageFiles(pkg);
      var songIni = firstDefined(
        options.songIni,
        readPackageText(resolvePackageEntry(files, ["songIni", "song.ini", "ini"]))
      );
      var chartText = readPackageText(resolvePackageEntry(files, ["notesChart", "notes.chart", "chart"]));
      if (chartText) {
        return self.fromNotesChart(chartText, adapter, mergeImportOptions(options, {
          songIni: songIni
        }));
      }

      var midiBuffer = readPackageBuffer(resolvePackageEntry(files, ["notesMid", "notes.mid", "notesmid", "midi"]));
      if (midiBuffer) {
        return self.fromMidiBuffer(midiBuffer, adapter, mergeImportOptions(options, {
          songIni: songIni
        }));
      }

      throw new Error("Unsupported chart package: expected notes.chart or notes.mid");
    });
  };

  ChartIO.prototype.parseSongIni = function(iniText) {
    return parseSongIni(iniText);
  };

  function parseChartSections(chartText) {
    var sections = {};
    var lines = String(chartText || "").replace(/\r/g, "").split("\n");
    var current = null;
    var insideBlock = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.indexOf("//") === 0) continue;
      if (line.charAt(0) === "[" && line.charAt(line.length - 1) === "]") {
        current = line.slice(1, -1).trim();
        if (!sections[current]) sections[current] = [];
        insideBlock = false;
        continue;
      }
      if (line === "{") {
        insideBlock = true;
        continue;
      }
      if (line === "}") {
        insideBlock = false;
        current = null;
        continue;
      }
      if (current && insideBlock) sections[current].push(line);
    }

    return sections;
  }

  function normalizePackageFiles(pkg) {
    if (!pkg) return {};
    if (pkg.files) return normalizeFileMap(pkg.files);
    return normalizeFileMap(pkg);
  }

  function normalizeFileMap(fileMap) {
    var normalized = {};
    for (var key in fileMap) {
      if (!Object.prototype.hasOwnProperty.call(fileMap, key)) continue;
      normalized[key] = fileMap[key];
      var lowerKey = String(key).toLowerCase();
      normalized[lowerKey] = fileMap[key];
      normalized[lowerKey.replace(/\s+/g, "")] = fileMap[key];
      normalized[lowerKey.replace(/[._-]/g, "")] = fileMap[key];
    }
    return normalized;
  }

  function resolvePackageEntry(files, aliases) {
    for (var i = 0; i < aliases.length; i++) {
      if (files[aliases[i]] != null) return files[aliases[i]];
      var lower = String(aliases[i]).toLowerCase();
      if (files[lower] != null) return files[lower];
      var compact = lower.replace(/\s+/g, "").replace(/[._-]/g, "");
      if (files[compact] != null) return files[compact];
    }
    return null;
  }

  function readPackageText(entry) {
    if (entry == null) return "";
    if (typeof entry === "string") return entry;
    if (typeof entry.text === "string") return entry.text;
    if (typeof entry.content === "string") return entry.content;
    if (entry.data && typeof entry.data === "string") return entry.data;
    if (entry.buffer) return uint8ArrayToText(toUint8Array(entry.buffer));
    if (entry.bytes) return uint8ArrayToText(toUint8Array(entry.bytes));
    return "";
  }

  function readPackageBuffer(entry) {
    if (entry == null) return null;
    if (entry.buffer) return toUint8Array(entry.buffer);
    if (entry.bytes) return toUint8Array(entry.bytes);
    if (entry.data && typeof entry.data !== "string") return toUint8Array(entry.data);
    if (entry instanceof Uint8Array || (typeof Buffer !== "undefined" && entry instanceof Buffer) || entry instanceof ArrayBuffer || Array.isArray(entry)) {
      return toUint8Array(entry);
    }
    return null;
  }

  function mergeImportOptions(base, extra) {
    var out = {};
    base = base || {};
    extra = extra || {};
    for (var key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) out[key] = base[key];
    }
    for (var name in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, name)) out[name] = extra[name];
    }
    return out;
  }

  function firstDefined() {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] != null && arguments[i] !== "") return arguments[i];
    }
    return "";
  }

  function parseSongSection(lines, iniMeta) {
    var meta = {
      id: iniMeta.id || "imported_chart",
      title: iniMeta.name || "Imported Chart",
      artist: iniMeta.artist || "Unknown Artist",
      charter: iniMeta.charter || "",
      offsetSec: numberOr(iniMeta.offset, 0),
      durationSec: numberOr(iniMeta.duration, 0),
      ppq: 480
    };

    for (var i = 0; i < lines.length; i++) {
      var entry = parseSectionEntry(lines[i]);
      if (!entry) continue;
      var key = entry.left.toLowerCase();
      var value = stripQuotes(entry.right);
      if (key === "name" && !iniMeta.name) meta.title = value || meta.title;
      if (key === "artist" && !iniMeta.artist) meta.artist = value || meta.artist;
      if (key === "charter" && !iniMeta.charter) meta.charter = value || meta.charter;
      if (key === "offset" && iniMeta.offset == null) meta.offsetSec = numberOr(value, meta.offsetSec);
      if (key === "resolution") meta.ppq = parseInt(value, 10) || meta.ppq;
    }

    if (!iniMeta.id) meta.id = toChartId(meta.title);
    return meta;
  }

  function parseSyncTrack(lines, ppq) {
    var segments = [];
    var timeSignatures = [];

    for (var i = 0; i < lines.length; i++) {
      var syncEvent = parseTrackEvent(lines[i]);
      if (!syncEvent) continue;
      if (syncEvent.kind === "B") {
        segments.push({
          tick: syncEvent.tick,
          bpm: syncEvent.value / 1000
        });
      } else if (syncEvent.kind === "TS") {
        timeSignatures.push({
          tick: syncEvent.tick,
          numerator: syncEvent.value,
          denominator: syncEvent.extra || 4
        });
      }
    }

    if (!segments.length) segments.push({ tick: 0, bpm: 120 });
    segments.sort(function(a, b) { return a.tick - b.tick; });

    return {
      tempoMap: new SparkTempoMap({
        ppq: ppq,
        segments: segments
      }),
      timeSignatures: timeSignatures
    };
  }

  function selectNoteTrack(sections, preferredTrackName) {
    if (preferredTrackName && sections[preferredTrackName]) {
      return {
        name: preferredTrackName,
        lines: sections[preferredTrackName]
      };
    }

    var priority = ["ExpertSingle", "ExpertGuitar", "HardSingle", "MediumSingle", "EasySingle"];
    for (var i = 0; i < priority.length; i++) {
      if (sections[priority[i]]) {
        return {
          name: priority[i],
          lines: sections[priority[i]]
        };
      }
    }

    return {
      name: preferredTrackName || "",
      lines: []
    };
  }

  function parseNoteTrack(trackInfo, ppq) {
    var grouped = {};
    var specialPhrases = [];
    var lines = trackInfo.lines || [];
    var difficulty = trackInfo.name || "ExpertSingle";
    var lastTickEnd = 0;

    for (var i = 0; i < lines.length; i++) {
      var noteEvent = parseTrackEvent(lines[i]);
      if (!noteEvent) continue;
      if (noteEvent.kind === "N") {
        var key = noteEvent.tick + "|" + noteEvent.length;
        if (!grouped[key]) {
          grouped[key] = new SparkNoteEvent({
            id: "evt_" + Object.keys(grouped).length,
            tick: noteEvent.tick,
            tickLength: noteEvent.length,
            laneMask: 0,
            flags: {},
            difficulty: difficulty,
            instrument: "guitar",
            label: ""
          });
        }
        applyLaneToEvent(grouped[key], noteEvent.value);
        lastTickEnd = Math.max(lastTickEnd, noteEvent.tick + noteEvent.length);
      } else if (noteEvent.kind === "S" && noteEvent.value === 2) {
        specialPhrases.push({
          startTick: noteEvent.tick,
          endTick: noteEvent.tick + noteEvent.length
        });
      }
    }

    var notes = [];
    for (var keyName in grouped) notes.push(grouped[keyName]);
    notes.sort(function(a, b) { return a.tick - b.tick; });

    for (var n = 0; n < notes.length; n++) {
      for (var p = 0; p < specialPhrases.length; p++) {
        if (notes[n].tick >= specialPhrases[p].startTick && notes[n].tick < specialPhrases[p].endTick) {
          notes[n].flags.specialPhrase = true;
          break;
        }
      }
    }

    return {
      trackName: difficulty,
      notes: notes,
      ppq: ppq,
      lastTickEnd: lastTickEnd,
      specialPhrases: specialPhrases
    };
  }

  function applyLaneToEvent(noteEvent, laneValue) {
    if (laneValue >= 0 && laneValue <= 4) {
      noteEvent.laneMask = noteEvent.laneMask | (1 << laneValue);
      return;
    }
    if (laneValue === 5) {
      noteEvent.flags.forced = true;
      return;
    }
    if (laneValue === 6) {
      noteEvent.flags.tap = true;
      return;
    }
    if (laneValue === 7) {
      noteEvent.flags.open = true;
      noteEvent.laneMask = 0;
    }
  }

  function buildPhrases(notesMeta, ppq) {
    var phrases = [];
    if (notesMeta.specialPhrases.length) {
      for (var i = 0; i < notesMeta.specialPhrases.length; i++) {
        phrases.push(new SparkPhrase({
          id: i,
          name: "Special Phrase " + (i + 1),
          startTick: notesMeta.specialPhrases[i].startTick,
          endTick: notesMeta.specialPhrases[i].endTick,
          flags: { special: true }
        }));
      }
      return phrases;
    }

    phrases.push(new SparkPhrase({
      id: 0,
      name: "Full Song",
      startTick: 0,
      endTick: notesMeta.lastTickEnd || ppq * 4,
      flags: {}
    }));
    return phrases;
  }

  function buildDefaultPhrase(lastTickEnd, ppq) {
    return [new SparkPhrase({
      id: 0,
      name: "Full Song",
      startTick: 0,
      endTick: lastTickEnd || ppq * 4,
      flags: {}
    })];
  }

  function buildMidiPhrases(markers, lastTickEnd, ppq) {
    if (!markers || !markers.length) return buildDefaultPhrase(lastTickEnd, ppq);
    var phrases = [];
    for (var i = 0; i < markers.length; i++) {
      var startTick = markers[i].tick;
      var endTick = i + 1 < markers.length ? markers[i + 1].tick : (lastTickEnd || startTick || ppq * 4);
      if (endTick <= startTick) continue;
      phrases.push(new SparkPhrase({
        id: i,
        name: markers[i].text || ("Phrase " + (i + 1)),
        startTick: startTick,
        endTick: endTick,
        flags: { source: "midi_marker" }
      }));
    }
    return phrases.length ? phrases : buildDefaultPhrase(lastTickEnd, ppq);
  }

  function buildMidiLaneEvents(rawNotes, laneCount) {
    var grouped = {};
    for (var i = 0; i < rawNotes.length; i++) {
      var note = rawNotes[i];
      var key = note.tick + "|" + note.tickLength;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(note);
    }

    var keys = Object.keys(grouped).sort(function(a, b) {
      var aTick = parseInt(a.split("|")[0], 10);
      var bTick = parseInt(b.split("|")[0], 10);
      if (aTick !== bTick) return aTick - bTick;
      var aLength = parseInt(a.split("|")[1], 10);
      var bLength = parseInt(b.split("|")[1], 10);
      return aLength - bLength;
    });

    var events = [];
    for (var j = 0; j < keys.length; j++) {
      var bucket = grouped[keys[j]].slice().sort(function(a, b) {
        return a.midi - b.midi;
      });
      var laneMask = 0;
      var pitches = [];
      for (var p = 0; p < bucket.length && p < laneCount; p++) {
        laneMask = laneMask | (1 << p);
        pitches.push(bucket[p].midi);
      }
      var first = bucket[0];
      events.push(new SparkNoteEvent({
        id: "midi_evt_" + j,
        tick: first.tick,
        tickLength: first.tickLength,
        laneMask: laneMask,
        flags: {
          midiNotes: pitches,
          source: "midi"
        },
        difficulty: "midi",
        instrument: "guitar",
        label: bucket.length > 1 ? "Chord" : midiPitchLabel(first.midi)
      }));
    }

    return events;
  }

  function parseMidiBuffer(buffer) {
    var bytes = toUint8Array(buffer);
    var reader = createMidiReader(bytes);
    var headerTag = reader.readStr(4);
    if (headerTag !== "MThd") throw new Error("Invalid MIDI file header");
    var headerLength = reader.readU32();
    var format = reader.readU16();
    var trackCount = reader.readU16();
    var division = reader.readU16();

    if (headerLength > 6) reader.skip(headerLength - 6);
    if (division & 0x8000) throw new Error("SMPTE MIDI timing is not supported");

    var ppq = division;
    var notes = [];
    var tempoSegments = [];
    var timeSignatures = [];
    var lastTickEnd = 0;
    var tracks = [];

    for (var trackIndex = 0; trackIndex < trackCount; trackIndex++) {
      var trackTag = reader.readStr(4);
      if (trackTag !== "MTrk") throw new Error("Invalid MIDI track header");
      var trackLength = reader.readU32();
      var trackEnd = reader.pos + trackLength;
      var absTick = 0;
      var runningStatus = 0;
      var activeNotes = {};
      var trackName = "";
      var trackNotes = [];
      var markers = [];

      while (reader.pos < trackEnd) {
        absTick += reader.readVLQ();
        var statusByte = reader.peek();
        var status = statusByte;
        if (statusByte < 0x80) {
          if (!runningStatus) throw new Error("Invalid MIDI running status");
          status = runningStatus;
        } else {
          status = reader.readU8();
          if (status < 0xF0) runningStatus = status;
        }

        if (status === 0xFF) {
          var metaType = reader.readU8();
          var metaLength = reader.readVLQ();
          if (metaType === 0x03) {
            trackName = reader.readStr(metaLength);
            continue;
          }
          if (metaType === 0x06 || metaType === 0x07 || metaType === 0x01) {
            markers.push({
              tick: absTick,
              text: reader.readStr(metaLength)
            });
            continue;
          }
          if (metaType === 0x51 && metaLength === 3) {
            var microsecondsPerBeat = (reader.readU8() << 16) | (reader.readU8() << 8) | reader.readU8();
            tempoSegments.push({
              tick: absTick,
              bpm: Math.round((60000000 / microsecondsPerBeat) * 1000) / 1000
            });
          } else if (metaType === 0x58 && metaLength >= 2) {
            var numerator = reader.readU8();
            var denominator = Math.pow(2, reader.readU8());
            if (metaLength > 2) reader.skip(metaLength - 2);
            timeSignatures.push({
              tick: absTick,
              numerator: numerator,
              denominator: denominator
            });
          } else {
            reader.skip(metaLength);
          }
          continue;
        }

        if (status === 0xF0 || status === 0xF7) {
          reader.skip(reader.readVLQ());
          continue;
        }

        var command = status & 0xF0;
        var channel = status & 0x0F;
        if (command === 0x80 || command === 0x90) {
          var noteNumber = reader.readU8();
          var velocity = reader.readU8();
          var noteKey = channel + ":" + noteNumber;
          if (command === 0x90 && velocity > 0) {
            activeNotes[noteKey] = {
              tick: absTick,
              midi: noteNumber,
              velocity: velocity,
              channel: channel
            };
          } else if (activeNotes[noteKey]) {
            var endedNote = {
              tick: activeNotes[noteKey].tick,
              tickLength: Math.max(0, absTick - activeNotes[noteKey].tick),
              midi: activeNotes[noteKey].midi,
              velocity: activeNotes[noteKey].velocity,
              channel: activeNotes[noteKey].channel
            };
            notes.push(endedNote);
            trackNotes.push(endedNote);
            lastTickEnd = Math.max(lastTickEnd, absTick);
            delete activeNotes[noteKey];
          }
          continue;
        }

        if (command === 0xA0 || command === 0xB0 || command === 0xE0) {
          reader.skip(2);
          continue;
        }
        if (command === 0xC0 || command === 0xD0) {
          reader.skip(1);
          continue;
        }
      }

      reader.pos = trackEnd;
      tracks.push({
        index: trackIndex,
        name: trackName,
        notes: trackNotes,
        markers: markers,
        lastTickEnd: getLastTickEnd(trackNotes),
        channels: getAvailableChannels(trackNotes)
      });
    }

    if (!tempoSegments.length || tempoSegments[0].tick !== 0) {
      tempoSegments.unshift({ tick: 0, bpm: 120 });
    }

    tempoSegments.sort(function(a, b) { return a.tick - b.tick; });
    notes.sort(function(a, b) {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.tickLength !== b.tickLength) return a.tickLength - b.tickLength;
      return a.midi - b.midi;
    });

    return {
      format: format,
      ppq: ppq,
      notes: notes,
      tracks: tracks,
      tempoSegments: dedupeTempoSegments(tempoSegments),
      timeSignatures: timeSignatures,
      lastTickEnd: lastTickEnd
    };
  }

  function dedupeTempoSegments(segments) {
    var deduped = [];
    for (var i = 0; i < segments.length; i++) {
      var previous = deduped[deduped.length - 1];
      if (previous && previous.tick === segments[i].tick) {
        previous.bpm = segments[i].bpm;
      } else {
        deduped.push({ tick: segments[i].tick, bpm: segments[i].bpm });
      }
    }
    return deduped;
  }

  function selectMidiTrack(tracks, options) {
    var usable = [];
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].notes && tracks[i].notes.length) usable.push(tracks[i]);
    }
    if (!usable.length) {
      return {
        index: 0,
        name: options.trackName || "",
        notes: [],
        markers: [],
        lastTickEnd: 0
      };
    }
    if (typeof options.trackIndex === "number" && usable[options.trackIndex]) return usable[options.trackIndex];
    if (options.trackName) {
      var wanted = String(options.trackName).toLowerCase();
      for (var j = 0; j < usable.length; j++) {
        if (String(usable[j].name || "").toLowerCase() === wanted) return usable[j];
      }
      for (var k = 0; k < usable.length; k++) {
        if (String(usable[k].name || "").toLowerCase().indexOf(wanted) >= 0) return usable[k];
      }
    }
    usable.sort(function(a, b) {
      var scoreDiff = scoreMidiTrack(b) - scoreMidiTrack(a);
      if (scoreDiff !== 0) return scoreDiff;
      return a.index - b.index;
    });
    return usable[0];
  }

  function scoreMidiTrack(track) {
    var name = String(track.name || "").toLowerCase();
    var score = track.notes.length;
    if (name.indexOf("guitar") >= 0) score += 1000;
    if (name.indexOf("part guitar") >= 0) score += 600;
    if (name.indexOf("lead") >= 0 || name.indexOf("single") >= 0) score += 350;
    if (name.indexOf("rhythm") >= 0) score += 250;
    if (name.indexOf("bass") >= 0) score -= 250;
    if (name.indexOf("drum") >= 0) score -= 800;
    if (name.indexOf("keys") >= 0 || name.indexOf("piano") >= 0) score -= 150;
    if (track.channels.length === 1 && track.channels[0] === 9) score -= 1000;
    return score;
  }

  function filterMidiTrackNotes(track, options) {
    options = options || {};
    var notes = Array.isArray(track.notes) ? track.notes.slice() : [];
    if (!notes.length) return notes;

    if (options.channelMode === "all") return notes;

    var melodicChannels = getAvailableChannels(notes).filter(function(channel) {
      return channel !== 9;
    });
    if (!melodicChannels.length) melodicChannels = getAvailableChannels(notes);

    var explicitChannels = [];
    if (typeof options.channel === "number") explicitChannels = [options.channel];
    else if (Array.isArray(options.preferredChannels)) explicitChannels = options.preferredChannels.slice();

    var selectedChannels = [];
    for (var i = 0; i < explicitChannels.length; i++) {
      if (melodicChannels.indexOf(explicitChannels[i]) >= 0) selectedChannels.push(explicitChannels[i]);
    }

    if (!selectedChannels.length && melodicChannels.length > 1) {
      selectedChannels = [selectDominantMidiChannel(notes, melodicChannels)];
    }
    if (!selectedChannels.length) selectedChannels = melodicChannels.slice();

    return notes.filter(function(note) {
      return selectedChannels.indexOf(note.channel) >= 0;
    });
  }

  function selectDominantMidiChannel(notes, channels) {
    var counts = {};
    for (var i = 0; i < channels.length; i++) counts[channels[i]] = 0;
    for (var j = 0; j < notes.length; j++) {
      if (counts[notes[j].channel] != null) counts[notes[j].channel]++;
    }
    var best = channels[0];
    var bestCount = counts[best] || 0;
    for (var k = 1; k < channels.length; k++) {
      var current = channels[k];
      var currentCount = counts[current] || 0;
      if (currentCount > bestCount) {
        best = current;
        bestCount = currentCount;
      }
    }
    return best;
  }

  function getLastTickEnd(notes) {
    var last = 0;
    for (var i = 0; i < notes.length; i++) {
      last = Math.max(last, notes[i].tick + notes[i].tickLength);
    }
    return last;
  }

  function getAvailableChannels(notes) {
    var seen = {};
    var channels = [];
    for (var i = 0; i < notes.length; i++) {
      var channel = notes[i].channel;
      if (seen[channel]) continue;
      seen[channel] = true;
      channels.push(channel);
    }
    channels.sort(function(a, b) { return a - b; });
    return channels;
  }

  function createMidiReader(bytes) {
    return {
      bytes: bytes,
      pos: 0,
      peek: function() {
        return this.bytes[this.pos];
      },
      skip: function(count) {
        this.pos += count;
      },
      readU8: function() {
        return this.bytes[this.pos++];
      },
      readU16: function() {
        return (this.readU8() << 8) | this.readU8();
      },
      readU32: function() {
        return ((this.readU8() << 24) >>> 0) | (this.readU8() << 16) | (this.readU8() << 8) | this.readU8();
      },
      readStr: function(length) {
        var out = "";
        for (var i = 0; i < length; i++) out += String.fromCharCode(this.readU8());
        return out;
      },
      readVLQ: function() {
        var value = 0;
        while (true) {
          var current = this.readU8();
          value = (value << 7) | (current & 0x7F);
          if (!(current & 0x80)) break;
        }
        return value;
      }
    };
  }

  function toUint8Array(buffer) {
    if (buffer instanceof Uint8Array) return buffer;
    if (Array.isArray(buffer)) return new Uint8Array(buffer);
    if (typeof Buffer !== "undefined" && buffer instanceof Buffer) {
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
    if (buffer && buffer.buffer instanceof ArrayBuffer) {
      return new Uint8Array(buffer.buffer, buffer.byteOffset || 0, buffer.byteLength || buffer.length || 0);
    }
    if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
    throw new Error("Unsupported MIDI buffer input");
  }

  function uint8ArrayToText(buffer) {
    var out = "";
    for (var i = 0; i < buffer.length; i++) out += String.fromCharCode(buffer[i]);
    return out;
  }

  function midiPitchLabel(midi) {
    var names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    var octave = Math.floor(midi / 12) - 1;
    return names[midi % 12] + octave;
  }

  function parseSongIni(iniText) {
    var out = {};
    var lines = String(iniText || "").replace(/\r/g, "").split("\n");
    var current = "";

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || line.charAt(0) === ";") continue;
      if (line.charAt(0) === "[" && line.charAt(line.length - 1) === "]") {
        current = line.slice(1, -1).trim().toLowerCase();
        continue;
      }
      if (current !== "song") continue;
      var idx = line.indexOf("=");
      if (idx < 0) continue;
      var key = line.slice(0, idx).trim().toLowerCase();
      var value = stripQuotes(line.slice(idx + 1).trim());
      out[key] = value;
    }

    if (out.name && !out.id) out.id = toChartId(out.name);
    return out;
  }

  function parseSectionEntry(line) {
    var idx = String(line || "").indexOf("=");
    if (idx < 0) return null;
    return {
      left: line.slice(0, idx).trim(),
      right: line.slice(idx + 1).trim()
    };
  }

  function parseTrackEvent(line) {
    var entry = parseSectionEntry(line);
    if (!entry) return null;
    var tick = parseInt(entry.left, 10);
    if (isNaN(tick)) return null;
    var parts = entry.right.split(/\s+/);
    if (parts.length < 2) return null;
    return {
      tick: tick,
      kind: parts[0],
      value: parseInt(parts[1], 10),
      length: parseInt(parts[2], 10) || 0,
      extra: parseInt(parts[3], 10) || 0
    };
  }

  function stripQuotes(value) {
    return String(value || "").replace(/^"(.*)"$/, "$1");
  }

  function toChartId(title) {
    return String(title || "imported_chart")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function numberOr(value, fallback) {
    var parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }

  if (typeof window !== "undefined") {
    window.SparkChartIO = ChartIO;
  }

  if (typeof module !== "undefined") {
    module.exports = {
      SparkChartIO: ChartIO
    };
  }
})();
