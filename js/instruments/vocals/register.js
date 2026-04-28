(function () {
  "use strict";

  var W = typeof window !== "undefined" ? window : globalThis;
  var ID = "vocals";

  function getState() {
    if (!W.S || typeof W.S !== "object") W.S = {};
    return W.S;
  }

  function getLessons() {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getLessons === "function") {
        return W.SparkVocalsModule.getLessons() || [];
      }
    } catch (err) {
      console.warn("[VocalSpark] getLessons failed", err);
    }
    return [];
  }

  function getSkillTree() {
    try {
      if (W.SparkVocalsModule && typeof W.SparkVocalsModule.getSkillTree === "function") {
        return W.SparkVocalsModule.getSkillTree();
      }
    } catch (err) {
      console.warn("[VocalSpark] getSkillTree failed", err);
    }
    return null;
  }

  function sameInstrument(item) {
    return item && String(item.id || item.key || item.slug || item.instrumentId || "").toLowerCase() === ID;
  }

  function upsertArray(arr, item) {
    if (!Array.isArray(arr)) return false;

    for (var i = 0; i < arr.length; i += 1) {
      if (sameInstrument(arr[i])) {
        arr[i] = Object.assign({}, arr[i], item);
        return true;
      }
    }

    arr.push(item);
    return true;
  }

  function upsertObject(obj, item) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    obj[ID] = Object.assign({}, obj[ID] || {}, item);
    return true;
  }

  function buildInstrument() {
    return {
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
      icon: "V",
      emoji: "V",
      description: "Pitch, breath, rhythm, and ear training.",
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
      open: openVocalsSpark,
      launch: openVocalsSpark,
      select: openVocalsSpark,
      startLesson: startVocalsLesson
    };
  }

  function registerFunction(name, item) {
    var fn = W[name];
    if (typeof fn !== "function") return false;

    try {
      fn(item);
      return true;
    } catch (err1) {
      try {
        fn(ID, item);
        return true;
      } catch (err2) {
        return false;
      }
    }
  }

  function registerRegistry(name, item) {
    var registry = W[name];
    if (!registry) return false;

    if (Array.isArray(registry)) return upsertArray(registry, item);

    if (typeof registry === "object") {
      var methods = ["register", "add", "set", "upsert", "registerInstrument", "addInstrument"];

      for (var i = 0; i < methods.length; i += 1) {
        var method = methods[i];

        if (typeof registry[method] === "function") {
          try {
            registry[method](item);
            return true;
          } catch (err1) {
            try {
              registry[method](ID, item);
              return true;
            } catch (err2) {}
          }
        }
      }

      return upsertObject(registry, item);
    }

    return false;
  }

  function registerVocals() {
    var item = buildInstrument();

    W.SparkVocalsShowroomInstrument = item;
    W.openVocalsSpark = openVocalsSpark;
    W.selectVocalsSpark = openVocalsSpark;
    W.startVocalsLesson = startVocalsLesson;

    [
      "registerInstrument",
      "registerSparkInstrument",
      "addInstrument",
      "addSparkInstrument",
      "registerInstrumentDefinition"
    ].forEach(function (name) {
      registerFunction(name, item);
    });

    [
      "SparkInstrumentRegistry",
      "InstrumentRegistry",
      "instrumentRegistry",
      "sparkInstrumentRegistry",
      "__sparkInstrumentRegistry",
      "SparkSuiteInstrumentRegistry"
    ].forEach(function (name) {
      registerRegistry(name, item);
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
        upsertArray(value, item);
      } else {
        upsertObject(value, item);
      }
    });

    try {
      W.dispatchEvent(new CustomEvent("spark:instrument-registered", { detail: item }));
      W.dispatchEvent(new CustomEvent("sparksuite:instrument-registered", { detail: item }));
    } catch (err) {}

    return item;
  }

  function selectVocals(lessonId) {
    var S = getState();

    var request = {
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
    W.__sparkForcedLessonRequest = request;

    S.currentInstrument = ID;
    S.selectedInstrument = ID;
    S.instrument = ID;
    S.instrumentId = ID;
    S.__activeInstrument = ID;
    S.__sparkInstrumentId = ID;
    S.__sparkSelectedInstrument = ID;
    S.__sparkCurrentInstrument = ID;
    S.__sparkForcedLessonRequest = request;

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
      if (typeof W.setCurrentInstrument === "function") {
        W.setCurrentInstrument(ID);
      }
    } catch (err) {}

    return request;
  }

  function openVocalsSpark() {
    registerVocals();

    var request = selectVocals(null);

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest(request);
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] openPracticePlanScreenRequest failed", err);
    }

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {
      console.warn("[VocalSpark] act(openPracticePlan) failed", err);
    }

    try {
      if (typeof W.render === "function") W.render();
    } catch (err) {}

    return false;
  }

  function startVocalsLesson(lessonId) {
    registerVocals();
    selectVocals(lessonId);

    try {
      if (typeof W.openPracticePlanScreenRequest === "function") {
        W.openPracticePlanScreenRequest(W.__sparkForcedLessonRequest);
        return false;
      }
    } catch (err) {}

    try {
      if (typeof W.act === "function") {
        W.act("openPracticePlan");
        return false;
      }
    } catch (err) {}

    return false;
  }

  function findContainer() {
    if (typeof document === "undefined" || !document.body) return null;

    return (
      document.querySelector("[data-instrument-grid]") ||
      document.querySelector("[data-showroom-grid]") ||
      document.querySelector("#instrumentGrid") ||
      document.querySelector("#instrument-grid") ||
      document.querySelector("#showroomGrid") ||
      document.querySelector("#showroom-grid") ||
      document.querySelector(".instrument-grid") ||
      document.querySelector(".showroom-grid") ||
      document.querySelector(".instrument-showroom") ||
      document.querySelector(".spark-showroom") ||
      document.querySelector(".showroom") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function ensureCard() {
    if (typeof document === "undefined" || !document.body) return;

    var existing = document.querySelector(
      '[data-instrument="vocals"], ' +
      '[data-instrument-id="vocals"], ' +
      '[data-spark-instrument="vocals"], ' +
      "#vocalspark-showroom-card"
    );

    if (existing) return;

    var text = String(document.body.innerText || "").toLowerCase();
    var looksLikeSelect = (
      text.indexOf("instrument") !== -1 ||
      text.indexOf("showroom") !== -1 ||
      text.indexOf("choose") !== -1 ||
      text.indexOf("select") !== -1
    );

    if (!looksLikeSelect) return;

    var container = findContainer();
    if (!container) return;

    var card = document.createElement("button");
    card.id = "vocalspark-showroom-card";
    card.type = "button";
    card.setAttribute("data-instrument", ID);
    card.setAttribute("data-instrument-id", ID);
    card.setAttribute("data-spark-instrument", ID);
    card.className = "instrument-card showroom-card spark-card vocals-card";
    card.textContent = "VocalSpark - Pitch, breath, rhythm, and ear training";
    card.style.cursor = "pointer";
    card.style.padding = "18px";
    card.style.margin = "12px";
    card.style.borderRadius = "18px";
    card.style.minWidth = "220px";

    card.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      return openVocalsSpark();
    });

    container.appendChild(card);
  }

  function boot() {
    registerVocals();
    ensureCard();
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

  console.info("[VocalSpark] bridge registered");
})();
