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

/* SparkSuite late vocals showroom registration
 * The vocals bridge can load before the showroom registries/card list are ready.
 * Re-register after boot and ask the shell/showroom to refresh.
 */
(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";

  function getInstrument() {
    return W.SparkVocalsShowroomInstrument || {
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
      open: W.openVocalsSpark,
      launch: W.openVocalsSpark,
      select: W.openVocalsSpark,
      startLesson: W.startVocalsLesson
    };
  }

  function sameId(item) {
    return item && String(item.id || item.key || item.slug || item.instrumentId || "").toLowerCase() === ID;
  }

  function upsertArray(arr, instrument) {
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

  function upsertObject(obj, instrument) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    obj[ID] = Object.assign({}, obj[ID] || {}, instrument);
    return true;
  }

  function registerFunction(name, instrument) {
    var fn = W[name];
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

  function registerRegistry(name, instrument) {
    var registry = W[name];
    if (!registry) return false;

    if (Array.isArray(registry)) {
      return upsertArray(registry, instrument);
    }

    if (typeof registry === "object") {
      var methods = [
        "register",
        "add",
        "set",
        "upsert",
        "registerInstrument",
        "addInstrument"
      ];

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

      return upsertObject(registry, instrument);
    }

    return false;
  }

  function refreshShowroom() {
    [
      "render",
      "renderApp",
      "renderLauncher",
      "renderShowroom",
      "renderLauncherOrShowroom",
      "_renderLauncherOrShowroomOverride"
    ].forEach(function (name) {
      try {
        if (typeof W[name] === "function") {
          W[name]();
        }
      } catch (err) {}
    });

    try {
      W.dispatchEvent(new CustomEvent("spark:showroom-refresh"));
      W.dispatchEvent(new CustomEvent("sparksuite:showroom-refresh"));
      W.dispatchEvent(new CustomEvent("spark:instrument-registered", { detail: getInstrument() }));
      W.dispatchEvent(new CustomEvent("sparksuite:instrument-registered", { detail: getInstrument() }));
    } catch (err) {}
  }

  function registerVocalsLate() {
    var instrument = getInstrument();

    W.SparkVocalsShowroomInstrument = instrument;

    [
      "registerInstrument",
      "registerSparkInstrument",
      "addInstrument",
      "addSparkInstrument",
      "registerInstrumentDefinition"
    ].forEach(function (name) {
      registerFunction(name, instrument);
    });

    [
      "SparkInstrumentRegistry",
      "InstrumentRegistry",
      "instrumentRegistry",
      "sparkInstrumentRegistry",
      "__sparkInstrumentRegistry",
      "SparkSuiteInstrumentRegistry"
    ].forEach(function (name) {
      registerRegistry(name, instrument);
    });

    [
      "SPARK_INSTRUMENTS",
      "SparkInstruments",
      "INSTRUMENTS",
      "instruments",
      "instrumentCatalog",
      "INSTRUMENT_CATALOG",
      "sparkInstrumentCatalog",
      "__sparkInstrumentCatalog",
      "__SPARK_INSTRUMENTS",
      "INSTRUMENT_MANIFEST",
      "SparkInstrumentManifest",
      "instrumentManifest",
      "__instrumentManifest",
      "__SPARK_INSTRUMENT_MANIFEST",
      "SPARK_INSTRUMENT_MANIFEST"
    ].forEach(function (name) {
      var value = W[name];

      if (Array.isArray(value)) {
        upsertArray(value, instrument);
      } else {
        upsertObject(value, instrument);
      }
    });

    refreshShowroom();
  }

  registerVocalsLate();

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", registerVocalsLate, { once: true });
  }

  if (W.addEventListener) {
    W.addEventListener("load", registerVocalsLate, { once: true });
  }

  setTimeout(registerVocalsLate, 0);
  setTimeout(registerVocalsLate, 250);
  setTimeout(registerVocalsLate, 1000);
  setTimeout(registerVocalsLate, 2000);

  console.info("[VocalSpark] late showroom registration active");
})();

/* SparkSuite VocalSpark final showroom + route fallback
 * VocalSpark is loaded, but the showroom can render from a static/cached list.
 * This keeps the module functional and adds a safe visible card if the renderer omits it.
 */
(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";

  function setSelectedVocalsFinal() {
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

  function openVocalsFinal() {
    setSelectedVocalsFinal();

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] act(openPracticePlan) failed", err);
    }

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest({
          instrument: ID,
          instrumentId: ID,
          source: "vocals-final-fallback"
        });
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] openPracticePlanScreenRequest failed", err);
    }

    try {
      if (typeof W.selectInstrument === "function") {
        W.selectInstrument(ID);
      }
    } catch (err) {}

    return false;
  }

  function startVocalsLessonFinal(lessonId) {
    setSelectedVocalsFinal();

    W.__sparkForcedLessonRequest = {
      instrument: ID,
      instrumentId: ID,
      lessonId: lessonId,
      source: "vocals-final-fallback"
    };

    return openVocalsFinal();
  }

  function sameId(item) {
    return item && String(item.id || item.key || item.slug || item.instrumentId || "").toLowerCase() === ID;
  }

  function upsertArray(arr, instrument) {
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

  function upsertObject(obj, instrument) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    obj[ID] = Object.assign({}, obj[ID] || {}, instrument);
    return true;
  }

  function getInstrument() {
    var instrument = W.SparkVocalsShowroomInstrument || {};

    instrument = Object.assign({
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
      order: 65
    }, instrument);

    instrument.open = openVocalsFinal;
    instrument.launch = openVocalsFinal;
    instrument.select = openVocalsFinal;
    instrument.startLesson = startVocalsLessonFinal;

    W.SparkVocalsShowroomInstrument = instrument;

    return instrument;
  }

  function registerVocalsFinal() {
    var instrument = getInstrument();

    [
      "SPARK_INSTRUMENTS",
      "SparkInstruments",
      "INSTRUMENTS",
      "instruments",
      "instrumentCatalog",
      "INSTRUMENT_CATALOG",
      "sparkInstrumentCatalog",
      "__sparkInstrumentCatalog",
      "__SPARK_INSTRUMENTS",
      "INSTRUMENT_MANIFEST",
      "SparkInstrumentManifest",
      "instrumentManifest",
      "__instrumentManifest",
      "__SPARK_INSTRUMENT_MANIFEST",
      "SPARK_INSTRUMENT_MANIFEST"
    ].forEach(function (name) {
      var value = W[name];

      if (Array.isArray(value)) {
        upsertArray(value, instrument);
      } else {
        upsertObject(value, instrument);
      }
    });

    [
      "registerInstrument",
      "registerSparkInstrument",
      "addInstrument",
      "addSparkInstrument",
      "registerInstrumentDefinition"
    ].forEach(function (name) {
      var fn = W[name];

      if (typeof fn !== "function") return;

      try {
        fn(instrument);
      } catch (err1) {
        try {
          fn(ID, instrument);
        } catch (err2) {}
      }
    });

    W.openVocalsSpark = openVocalsFinal;
    W.selectVocalsSpark = openVocalsFinal;
    W.startVocalsLesson = startVocalsLessonFinal;
  }

  function findShowroomContainer() {
    var selectors = [
      "[data-instrument-grid]",
      "[data-showroom-grid]",
      "#instrumentGrid",
      "#instrument-grid",
      "#showroomGrid",
      "#showroom-grid",
      ".instrument-grid",
      ".showroom-grid",
      ".instrument-showroom",
      ".spark-showroom",
      ".showroom",
      "main"
    ];

    for (var i = 0; i < selectors.length; i += 1) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }

    return document.body;
  }

  function ensureVocalsCard() {
    if (typeof document === "undefined" || !document.body) return;

    var existing = document.querySelector('[data-instrument="vocals"], [data-instrument-id="vocals"], [data-spark-instrument="vocals"], #vocalspark-showroom-card');

    if (existing) return;

    var bodyText = String(document.body.innerText || "").toLowerCase();

    if (bodyText.indexOf("vocals") !== -1 || bodyText.indexOf("vocalspark") !== -1) {
      return;
    }

    var container = findShowroomContainer();

    var card = document.createElement("button");
    card.id = "vocalspark-showroom-card";
    card.type = "button";
    card.setAttribute("data-instrument", "vocals");
    card.setAttribute("data-instrument-id", "vocals");
    card.setAttribute("data-spark-instrument", "vocals");
    card.className = "instrument-card showroom-card spark-card vocals-card";
    card.style.cursor = "pointer";
    card.style.textAlign = "left";
    card.style.borderRadius = "18px";
    card.style.padding = "18px";
    card.style.margin = "12px";
    card.style.border = "1px solid rgba(255,255,255,0.18)";
    card.style.background = "rgba(255,255,255,0.06)";
    card.style.color = "inherit";
    card.style.minWidth = "220px";

    card.innerHTML =
      '<div style="font-size:34px;line-height:1;margin-bottom:10px;">🎤</div>' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:6px;">VocalSpark</div>' +
      '<div style="font-size:14px;opacity:.78;">Pitch, breath, rhythm, and ear training.</div>' +
      '<div style="font-size:13px;font-weight:700;margin-top:14px;opacity:.9;">Open vocals →</div>';

    card.addEventListener("click", function (event) {
      event.preventDefault();
      openVocalsFinal();
      return false;
    });

    container.appendChild(card);
  }

  function refreshVocalsFinal() {
    registerVocalsFinal();

    try {
      W.dispatchEvent(new CustomEvent("spark:instrument-registered", { detail: getInstrument() }));
      W.dispatchEvent(new CustomEvent("sparksuite:instrument-registered", { detail: getInstrument() }));
      W.dispatchEvent(new CustomEvent("spark:showroom-refresh"));
      W.dispatchEvent(new CustomEvent("sparksuite:showroom-refresh"));
    } catch (err) {}

    ensureVocalsCard();
  }

  refreshVocalsFinal();

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshVocalsFinal, { once: true });
  }

  if (W.addEventListener) {
    W.addEventListener("load", refreshVocalsFinal, { once: true });
  }

  setTimeout(refreshVocalsFinal, 0);
  setTimeout(refreshVocalsFinal, 250);
  setTimeout(refreshVocalsFinal, 1000);
  setTimeout(refreshVocalsFinal, 2000);

  console.info("[VocalSpark] final showroom fallback active");
})();
