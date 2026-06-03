#!/usr/bin/env node
"use strict";

const Module = require("node:module");
const path = require("node:path");

if (typeof Module.enableCompileCache === "function") {
  Module.enableCompileCache = () => ({ status: "DISABLED_BY_RUNNER" });
}

const eslintPackageDir = path.dirname(require.resolve("eslint/package.json"));
require(path.join(eslintPackageDir, "bin/eslint.js"));
