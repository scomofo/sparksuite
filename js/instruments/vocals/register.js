(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";

  function getVocalsModule() {
    return W.SparkVocalsModule || null;
  }

  function getLessons() {
    var mod = getVocalsModule();
    if (mod && typeof mod.getLessons === "function") {
      try {
        return mod.getLessons() || [];
      } catch (err) {
        console.warn("[VocalSpark] getLessons failed", err);
      }
    }
    return [];
  }

  function getSkillTree() {
    var mod = getVocalsModule();
    if (mod && typeof mod.getSkillTree === "function") {
      try {
        return mod.getSkillTree();
      } catch (err) {
        console.warn("[VocalSpark] getSkillTree failed", err);
      }
    }
    return null;
  }

  function setSelectedVocals() {
    W.currentInstrument = ID;
    W.selectedInstrument = ID;
    W.__activeInstrument = ID;
    W.__sparkInstrumentId = ID;
    W.__sparkSelectedInstrument = ID;
    W.__sparkCurrentInstrument = ID;

    try {
      if (W.sparkCore && typeof W.sparkCore.setInstrument === "function") {
        W.sparkCore.setInstrument(ID);
      }
    } catch (err) {}

    try {
      if (typeof W.setCurrentInstrument === "function") {
        W.setCurrentInstrument(ID);
      }
    } catch (err) {}
  }

  function openVocals() {
    setSelectedVocals();

    try {
      if (typeof W.selectInstrument === "function" && !openVocals.__insideSelectInstrument) {
        openVocals.__insideSelectInstrument = true;
        W.selectInstrument(ID);
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] selectInstrument failed; falling back", err);
    } finally {
      openVocals.__insideSelectInstrument = false;
    }

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] act(openPracticePlan) failed", err);
    }

    return false;
  }

  function startVocalsLesson(lessonId) {
    setSelectedVocals();

    W.__sparkForcedLessonRequest = {
      instrument: ID,
      instrumentId: ID,
      lessonId: lessonId,
      source: "vocals-register"
    };

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] lesson launch failed", err);
    }

    return openVocals();
  }

  var instrument = {
    id: ID,
    key: ID,
    slug: ID,
    instrumentId: ID,
    appId: "vocalspark",
    name: "Vocals",
    title: "VocalSpark",
    displayName: "VocalSpark",
    shortName: "Vocals",
    moduleName: "SparkVocalsModule",
    adapterName: "SparkVocalsAdapter",
    family: "voice",
    type: "voice",
    category: "voice",
    icon: "🎤",
    emoji: "🎤",
    description: "Pitch, breath, rhythm, ear training, and vocal confidence.",
    shortDescription: "Pitch, breath, rhythm, and ear training.",
    enabled: true,
    isEnabled: true,
    visible: true,
    showroom: true,
    selectable: true,
    order: 65,
    getLessons: getLessons,
    lessons: getLessons,
    getSkillTree: getSkillTree,
    startLesson: startVocalsLesson,
    open: openVocals,
    launch: openVocals,
    select: openVocals
  };

  function sameId(item) {
    return item && String(item.id || item.key || item.slug || item.instrumentId || "").toLowerCase() === ID;
  }

  function upsertArray(arr) {
    if (!Array.isArray(arr)) return false;
    for (var i = 0; i < arr.length; i += 1) {
      if (sameId(arr[i])) {
        arr[i] = Object.assign({}, arr[i], instrument);
        return true;
      }
    }
    arr.push(instrument);
    return true;
  }

  function upsertObject(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    obj[ID] = Object.assign({}, obj[ID] || {}, instrument);
    return true;
  }

  function tryRegisterFunction(fnName) {
    var fn = W[fnName];
    if (typeof fn !== "function") return false;

    try {
      fn(instrument);
      return true;
    } catch (err1) {
      try {
        fn(ID, instrument);
        return true;
      } catch (err2) {
        return false;
      }
    }
  }

  function tryRegistry(name) {
    var registry = W[name];
    if (!registry) return false;

    if (Array.isArray(registry)) return upsertArray(registry);

    if (typeof registry === "object") {
      var methods = ["register", "add", "set", "upsert", "registerInstrument", "addInstrument"];

      for (var i = 0; i < methods.length; i += 1) {
        var method = methods[i];
        if (typeof registry[method] === "function") {
          try {
            registry[method](instrument);
            return true;
          } catch (err1) {
            try {
              registry[method](ID, instrument);
              return true;
            } catch (err2) {}
          }
        }
      }

      return upsertObject(registry);
    }

    return false;
  }

  [
    "registerInstrument",
    "registerSparkInstrument",
    "addInstrument",
    "addSparkInstrument",
    "registerInstrumentDefinition"
  ].forEach(tryRegisterFunction);

  [
    "SparkInstrumentRegistry",
    "InstrumentRegistry",
    "instrumentRegistry",
    "sparkInstrumentRegistry",
    "__sparkInstrumentRegistry",
    "SparkSuiteInstrumentRegistry"
  ].forEach(tryRegistry);

  [
    "SPARK_INSTRUMENTS",
    "SparkInstruments",
    "INSTRUMENTS",
    "instruments",
    "instrumentCatalog",
    "INSTRUMENT_CATALOG",
    "sparkInstrumentCatalog",
    "__sparkInstrumentCatalog",
    "__SPARK_INSTRUMENTS"
  ].forEach(function (name) {
    upsertArray(W[name]);
  });

  [
    "INSTRUMENT_MANIFEST",
    "SparkInstrumentManifest",
    "instrumentManifest",
    "__instrumentManifest",
    "__SPARK_INSTRUMENT_MANIFEST",
    "SPARK_INSTRUMENT_MANIFEST"
  ].forEach(function (name) {
    var value = W[name];
    if (Array.isArray(value)) {
      upsertArray(value);
    } else {
      upsertObject(value);
    }
  });

  W.SparkVocalsShowroomInstrument = instrument;
  W.openVocalsSpark = openVocals;
  W.selectVocalsSpark = openVocals;
  W.startVocalsLesson = startVocalsLesson;

  try {
    W.dispatchEvent(new CustomEvent("spark:instrument-registered", { detail: instrument }));
    W.dispatchEvent(new CustomEvent("sparksuite:instrument-registered", { detail: instrument }));
  } catch (err) {}

  console.info("[VocalSpark] showroom bridge registered");
})();
