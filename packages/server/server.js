const { loadSync } = require("@wolfpkgs/core/env");
const { dynamicImport } = require("@wolfpkgs/core/modules");

Object.entries(loadSync()).forEach(([key, value]) => {
  process.env[key] = value;
});

(async function main() {
  await dynamicImport("@directus/api/cli/run.js");
})();
