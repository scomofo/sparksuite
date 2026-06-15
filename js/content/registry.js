(function(){

  window.SparkContent = {
    lessons: {},
    songs: {},
    drills: {},
    templates: {},
    packs: {},
    songFamilies: {}
  };

  function normalizeContentInstrument(value) {
    if (value == null) return "";
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  function normalizeSongCatalogItem(item) {
    var song = item || {};
    var normalized = {};
    var key;
    var familyId;
    for (key in song) {
      if (Object.prototype.hasOwnProperty.call(song, key)) normalized[key] = song[key];
    }
    familyId = normalized.familyId || normalized.songFamilyId || normalized.id || "";
    normalized.familyId = familyId;
    if (!normalized.defaultInstrument) {
      normalized.defaultInstrument = normalized.instrument || normalized.instrumentType || normalized.adapterType || "";
    }
    if (!normalized.highwaySource) {
      normalized.highwaySource = normalized.chartId ? "chart" : "";
    }
    if (!normalized.audio && normalized.midi) {
      normalized.audio = {
        type: "midi",
        src: normalized.midi,
        label: "Built-in MIDI Backing"
      };
    } else if (normalized.audio && typeof normalized.audio === "string") {
      normalized.audio = {
        type: "audio",
        src: normalized.audio,
        label: "Built-in Backing Track"
      };
    }
    return normalized;
  }

  function ensureSongFamily(families, familyId, song) {
    if (!families[familyId]) {
      families[familyId] = {
        id: familyId,
        canonicalSongId: song && song.id ? song.id : familyId,
        title: song && song.title ? song.title : familyId,
        artist: song && song.artist ? song.artist : "",
        defaultInstrument: song && song.defaultInstrument ? song.defaultInstrument : "",
        songs: [],
        chartIds: [],
        instruments: [],
        variants: []
      };
    }
    return families[familyId];
  }

  function pushUnique(list, value) {
    if (!value) return;
    if (list.indexOf(value) === -1) list.push(value);
  }

  function addSongFamilyVariant(family, variant) {
    var key = (variant.chartId || "") + "::" + (variant.instrument || "") + "::" + (variant.source || "");
    var i;
    for (i = 0; i < family.variants.length; i++) {
      if (((family.variants[i].chartId || "") + "::" + (family.variants[i].instrument || "") + "::" + (family.variants[i].source || "")) === key) {
        return;
      }
    }
    family.variants.push(variant);
    pushUnique(family.chartIds, variant.chartId || "");
    pushUnique(family.instruments, variant.instrument || "");
  }

  function rebuildSongFamilyIndex() {
    var songs = SparkContent.songs || {};
    var families = {};
    var key;
    var song;
    var familyId;
    var family;
    var manifestCharts;
    var i;
    var chart;
    var chartSong;
    var chartFamilyId;

    for (key in songs) {
      if (!Object.prototype.hasOwnProperty.call(songs, key)) continue;
      song = songs[key] || {};
      familyId = song.familyId || song.songFamilyId || song.id || key;
      family = ensureSongFamily(families, familyId, song);
      if (!family.canonicalSongId && song.id) family.canonicalSongId = song.id;
      if (!family.title && song.title) family.title = song.title;
      if (!family.artist && song.artist) family.artist = song.artist;
      if (!family.defaultInstrument && song.defaultInstrument) family.defaultInstrument = song.defaultInstrument;
      pushUnique(family.songs, song.id || key);
      addSongFamilyVariant(family, {
        songId: song.id || key,
        instrument: normalizeContentInstrument(song.defaultInstrument || song.instrument || song.instrumentType || song.adapterType || ""),
        chartId: song.chartId || "",
        arrangementType: song.arrangementType || "chords",
        source: song.highwaySource || (song.chartId ? "chart" : "catalog")
      });
    }

    manifestCharts = window.PERFORMANCE_CHART_MANIFEST && Array.isArray(window.PERFORMANCE_CHART_MANIFEST.charts)
      ? window.PERFORMANCE_CHART_MANIFEST.charts
      : [];
    for (i = 0; i < manifestCharts.length; i++) {
      chart = manifestCharts[i] || {};
      if (!chart.songId) continue;
      chartSong = songs[chart.songId] || null;
      chartFamilyId = chartSong && chartSong.familyId ? chartSong.familyId : chart.songId;
      family = ensureSongFamily(families, chartFamilyId, chartSong || {
        id: chart.songId,
        title: chart.title || chart.songId,
        artist: chart.artist || ""
      });
      addSongFamilyVariant(family, {
        songId: chart.songId,
        instrument: normalizeContentInstrument(chart.instrument || chart.instrumentType || chart.adapterType || ""),
        chartId: chart.id || "",
        arrangementType: chart.arrangementType || "chords",
        source: chart.sourceType || "chart"
      });
    }

    SparkContent.songFamilies = families;
    return families;
  }

  function registerContent(type, items){
    items = Array.isArray(items) ? items : [];
    SparkContent[type] = {};
    for(var i=0;i<items.length;i++){
      if(!items[i] || !items[i].id){ console.error(type + " item at index " + i + " is missing an id, skipping"); continue; }
      SparkContent[type][items[i].id] = type === "songs" ? normalizeSongCatalogItem(items[i]) : items[i];
    }
    if(type === "songs") rebuildSongFamilyIndex();
    if(type === "packs" && typeof syncCurriculumStateRequest === "function") syncCurriculumStateRequest();
  }

  function getContent(type, id){
    return SparkContent[type] ? SparkContent[type][id] : null;
  }

  function getSongFamily(id) {
    if (!id) return null;
    rebuildSongFamilyIndex();
    if (SparkContent.songFamilies[id]) return SparkContent.songFamilies[id];
    if (SparkContent.songs && SparkContent.songs[id] && SparkContent.songs[id].familyId) {
      return SparkContent.songFamilies[SparkContent.songs[id].familyId] || null;
    }
    return null;
  }

  function getSongFamilyVariants(id) {
    var family = getSongFamily(id);
    return family && Array.isArray(family.variants) ? family.variants.slice() : [];
  }

  window.registerContent = registerContent;
  window.getContent = getContent;
  window.rebuildSongFamilyIndex = rebuildSongFamilyIndex;
  window.getSongFamily = getSongFamily;
  window.getSongFamilyVariants = getSongFamilyVariants;

})();
