const fs = require("fs");

function buildRendererSmokeScript(options) {
  options = options || {};
  const userId = JSON.stringify(options.userId || "smoke_user");

  return `
    (function() {
      function snapshotState() {
        var sparkKeys = [];
        var key;
        for (key in window) {
          if (Object.prototype.hasOwnProperty.call(window, key) && key.toLowerCase().indexOf("spark") >= 0) {
            sparkKeys.push(key);
          }
        }
        sparkKeys.sort();
        return {
          readyState: document.readyState,
          hasBootLoader: !!window.SparkBootLoader,
          deferredReady: window.SparkBootLoader && typeof window.SparkBootLoader.isDeferredReady === "function"
            ? window.SparkBootLoader.isDeferredReady()
            : null,
          deferredFailures: window.SparkBootLoader && typeof window.SparkBootLoader.getFailures === "function"
            ? window.SparkBootLoader.getFailures()
            : [],
          hasSparkCore: !!window.sparkCore,
          hasExport: !!window.exportSparkUserData,
          hasImport: !!window.importSparkUserData,
          hasDebugBundle: !!window.buildSparkDebugBundle,
          hasSessionTypes: !!window.SparkSessionTypes,
          sparkKeys: sparkKeys.slice(0, 40)
        };
      }

      function waitFor(predicate, timeoutMs) {
        var startedAt = Date.now();
        return new Promise(function(resolve, reject) {
          (function poll() {
            if (predicate()) {
              resolve();
              return;
            }
            if (Date.now() - startedAt >= timeoutMs) {
              reject(new Error("Timed out waiting for SparkSuite smoke dependencies: " + JSON.stringify(snapshotState())));
              return;
            }
            setTimeout(poll, 50);
          })();
        });
      }

      return (async function() {
        var smokeUserId = ${userId};
        var importPayload;
        var imported;
        var plan;
        var exported;
        var debugBundle;
        var segmentIds;
        var outcome = null;
        var index;

        if (window.SparkBootLoader && typeof window.SparkBootLoader.loadDeferredScripts === "function") {
          await new Promise(function(resolve, reject) {
            try {
              window.SparkBootLoader.loadDeferredScripts(function() {
                if (typeof window.SparkBootLoader.hasFailures === "function" && window.SparkBootLoader.hasFailures()) {
                  reject(new Error("Deferred script load failed: " + window.SparkBootLoader.getFailures().join(", ")));
                  return;
                }
                resolve();
              });
            } catch (error) {
              reject(error);
            }
          });
        }

        await waitFor(function() {
          return !!(
            window.exportSparkUserData &&
            window.importSparkUserData &&
            window.buildSparkDebugBundle &&
            window.SparkSessionTypes &&
            typeof window.createDefaultSparkCore === "function" &&
            window.SparkCoreRuntime
          );
        }, 20000);

        if (!window.sparkCore) {
          try {
            window.sparkCore = window.createDefaultSparkCore();
          } catch (error) {
            throw new Error("createDefaultSparkCore failed: " + (error && error.message ? error.message : String(error)));
          }
        }

        importPayload = {
          schemaVersion: 1,
          profile: {
            userId: smokeUserId,
            xp: 9,
            selectedInstrument: "guitar",
            mastery: {}
          },
          settings: {
            gameplay: {
              inputLatencyOffsetMs: -12
            }
          },
          practiceJournal: [
            {
              id: "smoke_entry",
              lessonId: "gtr-d01",
              note: "packaged-smoke"
            }
          ]
        };

        imported = window.importSparkUserData({
          payload: importPayload,
          storage: window.sparkCore.storage
        });

        plan = window.sparkCore.startSession({
          flow: window.SparkSessionTypes.FLOW_DAILY_PRACTICE
        });

        segmentIds = Array.isArray(plan && plan.segments)
          ? plan.segments.map(function(segment) { return segment.id; })
          : [];

        for (index = 0; index < segmentIds.length; index++) {
          outcome = window.sparkCore.completeSession({
            flow: plan.flow,
            itemId: segmentIds[index],
            result: {
              hits: 9,
              total: 10
            }
          });
        }

        exported = window.exportSparkUserData({
          storage: window.sparkCore.storage,
          userId: smokeUserId
        });

        debugBundle = window.buildSparkDebugBundle({
          sparkCore: window.sparkCore,
          eventBus: window.sparkCore.getEventBus ? window.sparkCore.getEventBus() : null,
          storage: window.sparkCore.storage,
          performanceMonitor: window.sparkCore.performanceMonitor
        });

        return {
          ok: true,
          importedUserId: imported && imported.profile ? imported.profile.userId : null,
          exportedUserId: exported && exported.profile ? exported.profile.userId : null,
          sessionPlanId: plan ? plan.id : null,
          segmentCount: segmentIds.length,
          completed: !!(outcome && outcome.planCompleted),
          debugBundleSessionId: debugBundle && debugBundle.session ? debugBundle.session.id : null,
          schemaVersion: exported ? exported.schemaVersion : null,
          practiceJournalCount: exported && Array.isArray(exported.practiceJournal) ? exported.practiceJournal.length : 0
        };
      })();
    })();
  `;
}

function writeSmokeOutput(outputPath, payload) {
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), "utf8");
}

async function runPackagedSmokeForWindow(windowHandle, options) {
  options = options || {};
  const outputPath = options.outputPath;
  const userId = options.userId || "smoke_user";
  const onComplete = typeof options.onComplete === "function" ? options.onComplete : null;

  if (!windowHandle || !windowHandle.webContents || typeof windowHandle.webContents.on !== "function") {
    throw new Error("runPackagedSmokeForWindow requires a BrowserWindow-like handle");
  }
  if (!outputPath) {
    throw new Error("runPackagedSmokeForWindow requires outputPath");
  }

  windowHandle.webContents.on("did-finish-load", async function() {
    try {
      const result = await windowHandle.webContents.executeJavaScript(
        buildRendererSmokeScript({ userId: userId })
      );
      writeSmokeOutput(outputPath, result);
      if (onComplete) onComplete(result, null);
    } catch (error) {
      const failure = {
        ok: false,
        error: error && error.message ? error.message : String(error),
        exportedAt: new Date().toISOString()
      };
      writeSmokeOutput(outputPath, failure);
      if (onComplete) onComplete(failure, error);
    }
  });

  return true;
}

module.exports = {
  buildRendererSmokeScript,
  runPackagedSmokeForWindow
};
