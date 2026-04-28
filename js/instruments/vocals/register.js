(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";

  function getSparkState() {
    if (!W.S || typeof W.S !== "object") {
      W.S = {};
    }
    return W.S;
  }

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

  function getInstrument() {
    var existing = W.SparkVocalsShowroomInstrument || {};

    var instrument = Object.assign({
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
      getSkillTree: getSkillTree
    }, existing);

    instrument.open = openVocalsSpark;
    instrument.launch = openVocalsSpark;
    instrument.select = openVocalsSpark;
    instrument.startLesson = startVocalsLesson;

    W.SparkVocalsShowroomInstrument = instrument;

    return instrument;
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

  function callRegisterFunction(name, instrument) {
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

  function registerIntoRegistry(name, instrument) {
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

  function registerVocals() {
    var instrument = getInstrument();

    [
      "registerInstrument",
      "registerSparkInstrument",
      "addInstrument",
      "addSparkInstrument",
      "registerInstrumentDefinition"
    ].forEach(function (name) {
      callRegisterFunction(name, instrument);
    });

    [
      "SparkInstrumentRegistry",
      "InstrumentRegistry",
      "instrumentRegistry",
      "sparkInstrumentRegistry",
      "__sparkInstrumentRegistry",
      "SparkSuiteInstrumentRegistry"
    ].forEach(function (name) {
      registerIntoRegistry(name, instrument);
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

    try {
      W.dispatchEvent(new CustomEvent("spark:instrument-registered", { detail: instrument }));
      W.dispatchEvent(new CustomEvent("sparksuite:instrument-registered", { detail: instrument }));
    } catch (err) {}

    return instrument;
  }

  function setSelectedVocals(lessonId) {
    var S = getSparkState();

    var forcedRequest = {
      instrument: ID,
      instrumentId: ID,
      lessonId: lessonId || null,
      forceRebuild: true,
      source: "vocals-register"
    };

    W.currentInstrument = ID;
    W.selectedInstrument = ID;
    W.__activeInstrument = ID;
    W.__sparkInstrumentId = ID;
    W.__sparkSelectedInstrument = ID;
    W.__sparkCurrentInstrument = ID;
    W.__sparkForcedLessonRequest = forcedRequest;

    S.currentInstrument = ID;
    S.selectedInstrument = ID;
    S.instrument = ID;
    S.instrumentId = ID;
    S.__activeInstrument = ID;
    S.__sparkInstrumentId = ID;
    S.__sparkSelectedInstrument = ID;
    S.__sparkCurrentInstrument = ID;
    S.__sparkForcedLessonRequest = forcedRequest;

    try {
      sessionStorage.setItem("spark.currentInstrument", ID);
      sessionStorage.setItem("spark.selectedInstrument", ID);
      sessionStorage.setItem("spark.instrumentId", ID);
    } catch (err) {}

    try {
      localStorage.setItem("spark.currentInstrument", ID);
      localStorage.setItem("spark.selectedInstrument", ID);
      localStorage.setItem("spark.instrumentId", ID);
    } catch (err) {}

    try {
      if (W.sparkCore && typeof W.sparkCore.setInstrument === "function") {
        W.sparkCore.setInstrument(ID);
      }
    } catch (err) {}

    try {
      if (W.sparkCore && typeof W.sparkCore.selectInstrument === "function") {
        W.sparkCore.selectInstrument(ID);
      }
    } catch (err) {}

    try {
      if (typeof W.setCurrentInstrument === "function") {
        W.setCurrentInstrument(ID);
      }
    } catch (err) {}

    return forcedRequest;
  }

  function refreshShellSoon() {
    function run() {
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
    }

    setTimeout(run, 0);
    setTimeout(run, 100);
    setTimeout(run, 350);
  }

  function openPracticeForVocals(lessonId) {
    registerVocals();

    var payload = setSelectedVocals(lessonId);

    W.__vocalSparkLastOpenPayload = payload;

    var directOpened = false;

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest(payload);
        directOpened = true;
      }
    } catch (err) {
      console.warn("[VocalSpark] openPracticePlanScreenRequest failed", err);
    }

    try {
      if (W.sparkCore && typeof W.sparkCore.openPracticePlanScreen === "function") {
        W.sparkCore.openPracticePlanScreen(payload);
        directOpened = true;
      }
    } catch (err) {
      console.warn("[VocalSpark] sparkCore.openPracticePlanScreen failed", err);
    }

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        directOpened = true;
      }
    } catch (err) {
      console.warn("[VocalSpark] act(openPracticePlan) failed", err);
    }

    try {
      W.dispatchEvent(new CustomEvent("sparksuite:open-practice-plan", { detail: payload }));
      W.dispatchEvent(new CustomEvent("spark:open-practice-plan", { detail: payload }));
    } catch (err) {}

    refreshShellSoon();

    if (!directOpened) {
      console.warn("[VocalSpark] No practice-plan route function was available.");
    }

    return false;
  }

  function openVocalsSpark() {
    return openPracticeForVocals(null);
  }

  function startVocalsLesson(lessonId) {
    return openPracticeForVocals(lessonId);
  }

  function findShowroomContainer() {
    if (typeof document === "undefined" || !document.body) return null;

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

  function hasVocalsCard() {
    if (typeof document === "undefined") return true;

    return !!document.querySelector(
      '[data-instrument="vocals"], ' +
      '[data-instrument-id="vocals"], ' +
      '[data-spark-instrument="vocals"], ' +
      '#vocalspark-showroom-card'
    );
  }

  function bodyLooksLikeInstrumentSelect() {
    if (typeof document === "undefined" || !document.body) return false;

    var text = String(document.body.innerText || "").toLowerCase();

    return (
      text.indexOf("instrument") !== -1 ||
      text.indexOf("showroom") !== -1 ||
      text.indexOf("choose") !== -1 ||
      text.indexOf("select") !== -1
    );
  }

  function ensureVocalsCard() {
    if (typeof document === "undefined" || !document.body) return;
    if (!bodyLooksLikeInstrumentSelect()) return;
    if (hasVocalsCard()) return;

    var container = findShowroomContainer();
    if (!container) return;

    var card = document.createElement("button");

    card.id = "vocalspark-showroom-card";
    card.type = "button";
    card.setAttribute("data-instrument", ID);
    card.setAttribute("data-instrument-id", ID);
    card.setAttribute("data-spark-instrument", ID);
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
      event.stopPropagation();
      return openVocalsSpark();
    });

    container.appendChild(card);
  }

  function boot() {
    registerVocals();

    W.openVocalsSpark = openVocalsSpark;
    W.selectVocalsSpark = openVocalsSpark;
    W.startVocalsLesson = startVocalsLesson;

    ensureVocalsCard();

    try {
      W.dispatchEvent(new CustomEvent("spark:showroom-refresh"));
      W.dispatchEvent(new CustomEvent("sparksuite:showroom-refresh"));
    } catch (err) {}
  }

  boot();

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  }

  if (W.addEventListener) {
    W.addEventListener("load", boot, { once: true });
  }

  setTimeout(boot, 0);
  setTimeout(boot, 250);
  setTimeout(boot, 1000);
  setTimeout(boot, 2000);

  if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
    setTimeout(function () {
      if (!document.body) return;

      var observer = new MutationObserver(function () {
        registerVocals();
        ensureVocalsCard();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      W.__vocalSparkShowroomObserver = observer;
    }, 0);
  }

  console.info("[VocalSpark] clean bridge registered");
})();
