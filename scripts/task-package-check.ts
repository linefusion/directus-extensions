/**
 * !TODO: refactor into generators.
 */

import jora from "npm:jora";
import $ from "jsr:@david/dax";

import { Command } from "jsr:@cliffy/command@1.0.0-rc.4";

export const WORKSPACE_DIR = Object.freeze($.path("."));
export const PACKAGES_DIR = Object.freeze($.path("./packages"));

export async function readRootPackage() {
  return JSON.parse(
    Deno.readTextFileSync(WORKSPACE_DIR.join("package.json").toString())
  );
}

export async function listPackages() {
  const locations = ["*/package.json", "extensions/*/package.json"];

  const globs = locations.map((pattern) =>
    Array.fromAsync(PACKAGES_DIR.expandGlob(pattern))
  );

  const packages = (await Promise.allSettled(globs)).flat();

  return packages;
}

export async function readPackages() {
  const packages = await listPackages();
  return await Promise.all(
    packages.map((pkg) => {
      const json = JSON.parse(Deno.readTextFileSync(packages.toString()));
      return {
        ...pkg,
        json,
      };
    })
  );
}

export const task = new Command();

task.name("package:check");

task.description("Check if package.json files are normalized and up-to-date.");

task.action(async () => {


});
