const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function resolveElectronPortableArtifact(rootDir) {
  const candidates = [
    path.join(rootDir, "dist", "SparkSuite Portable.exe"),
    path.join(rootDir, "dist", "win-unpacked", "SparkSuite.exe")
  ];
  return resolveFirstExisting(candidates);
}

function resolveFirstExisting(candidates) {
  let i;
  for (i = 0; i < candidates.length; i++) {
    if (fs.existsSync(candidates[i])) {
      return candidates[i];
    }
  }
  return null;
}

// Electron is the only packaging runtime — Tauri and Capacitor were removed
// when the project committed to a single Windows desktop target.
function buildSmokePlan(options) {
  options = options || {};
  const commands = [];

  if (!options.skipVerify) {
    commands.push("npm run verify");
  }

  if (!options.skipBuild) {
    commands.push("npm run build:portable");
  }

  return {
    rootDir: options.rootDir,
    runtime: "electron",
    commands: commands
  };
}

function parseArgs(argv) {
  const options = {
    rootDir: process.cwd(),
    runtime: "electron",
    skipVerify: false,
    skipBuild: false
  };
  let index;

  for (index = 0; index < argv.length; index++) {
    if (argv[index] === "--skip-verify") {
      options.skipVerify = true;
    } else if (argv[index] === "--skip-build") {
      options.skipBuild = true;
    }
  }

  return options;
}

function runCommand(command, rootDir) {
  const result = spawnSync(command, {
    cwd: rootDir,
    shell: true,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error("Command failed: " + command);
  }
}

function launchElectronSmoke(artifactPath, rootDir) {
  const outputPath = path.join(os.tmpdir(), "sparksuite_packaged_smoke_output.json");
  const env = Object.assign({}, process.env, {
    SPARKSUITE_SMOKE_OUTPUT: outputPath,
    SPARKSUITE_SMOKE_USER_ID: "smoke_user"
  });
  const result = spawnSync(artifactPath, [], {
    cwd: rootDir,
    env: env,
    stdio: "inherit",
    timeout: 120000
  });
  let payload;

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error("Packaged smoke app exited with code " + result.status);
  }
  if (!fs.existsSync(outputPath)) {
    throw new Error("Packaged smoke app did not produce output");
  }

  payload = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  if (!payload.ok) {
    throw new Error("Packaged smoke failed: " + payload.error);
  }
  validatePackagedSmokePayload(payload);

  return payload;
}

function validatePackagedSmokePayload(payload) {
  if (!payload.completed) {
    throw new Error("Packaged smoke did not complete a session");
  }
  if (!payload.importedUserId || !payload.exportedUserId) {
    throw new Error("Packaged smoke did not import/export canonical user data");
  }
  if (!payload.debugBundleSessionId) {
    throw new Error("Packaged smoke did not build a debug bundle");
  }
  if (!payload.backupIntegrity || !payload.backupIntegrity.hasCanonicalUserData || !payload.backupIntegrity.hasDebugBundle) {
    throw new Error("Packaged smoke did not build a complete full local backup");
  }
  if (payload.backupIntegrity.profileUserId !== payload.exportedUserId) {
    throw new Error("Packaged smoke full backup user did not match exported user data");
  }

  return true;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = buildSmokePlan(options);
  let artifactPath;
  let payload;

  plan.commands.forEach(function(command) {
    runCommand(command, options.rootDir);
  });

  artifactPath = resolveElectronPortableArtifact(options.rootDir);
  if (!artifactPath) {
    throw new Error("Unable to find built Electron portable artifact");
  }

  payload = launchElectronSmoke(artifactPath, options.rootDir);
  console.log("PASS: Packaged Electron smoke completed");
  console.log(JSON.stringify({
    artifactPath: artifactPath,
    sessionPlanId: payload.sessionPlanId,
    schemaVersion: payload.schemaVersion,
    backupApp: payload.backupApp,
    backupSchemaVersion: payload.backupSchemaVersion,
    importedUserId: payload.importedUserId,
    exportedUserId: payload.exportedUserId
  }, null, 2));
}

module.exports = {
  buildSmokePlan,
  launchElectronSmoke,
  parseArgs,
  resolveElectronPortableArtifact,
  validatePackagedSmokePayload
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  }
}
