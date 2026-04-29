const { spawnSync } = require("child_process");

const commands = [
  "npm run lint",
  "npm test",
  "npm run test:contracts",
  "npm run lint:content"
];

commands.forEach(run);

console.log("OK verify passed");

function run(command) {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    shell: true,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
