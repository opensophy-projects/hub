#!/usr/bin/env node
"use strict";

const Module = require("node:module");

if (typeof Module.enableCompileCache === "function") {
  Module.enableCompileCache = () => ({ status: "DISABLED_BY_RUNNER" });
}

const path = require("node:path");

const eslintPackageJson = require.resolve("eslint/package.json");
const eslintBin = path.join(path.dirname(eslintPackageJson), "bin/eslint.js");

require(eslintBin);
