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

function resolveTauriBundleArtifact(rootDir) {
  const candidates = [
    path.join(rootDir, "src-tauri", "target", "release", "SparkSuite.exe"),
    path.join(rootDir, "src-tauri", "target", "release", "bundle", "nsis", "SparkSuite_1.0.0_x64-setup.exe")
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

function buildSmokePlan(options) {
  options = options || {};
  const runtime = options.runtime || "electron";
  const commands = [];

  if (!options.skipVerify) {
    commands.push("npm run verify");
  }

  if (!options.skipBuild) {
    if (runtime === "tauri") {
      commands.push("npm run tauri:build");
    } else {
      commands.push("npm run build:portable");
    }
  }

  return {
    rootDir: options.rootDir,
    runtime: runtime,
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
    if (argv[index] === "--runtime" && argv[index + 1]) {
      options.runtime = argv[index + 1];
      index++;
    } else if (argv[index] === "--skip-verify") {
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
  if (!payload.completed) {
    throw new Error("Packaged smoke did not complete a session");
  }
  if (!payload.importedUserId || !payload.exportedUserId) {
    throw new Error("Packaged smoke did not import/export canonical user data");
  }
  if (!payload.debugBundleSessionId) {
    throw new Error("Packaged smoke did not build a debug bundle");
  }

  return payload;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const plan = buildSmokePlan(options);
  let artifactPath;
  let payload;

  plan.commands.forEach(function(command) {
    runCommand(command, options.rootDir);
  });

  if (plan.runtime === "tauri") {
    artifactPath = resolveTauriBundleArtifact(options.rootDir);
    if (!artifactPath) {
      throw new Error("Unable to find built Tauri artifact");
    }
    console.log("PASS: Tauri packaged artifact exists at " + artifactPath);
    return;
  }

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
    importedUserId: payload.importedUserId,
    exportedUserId: payload.exportedUserId
  }, null, 2));
}

module.exports = {
  buildSmokePlan,
  launchElectronSmoke,
  parseArgs,
  resolveElectronPortableArtifact,
  resolveTauriBundleArtifact
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
  }
}
