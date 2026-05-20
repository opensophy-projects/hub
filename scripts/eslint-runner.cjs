#!/usr/bin/env node
"use strict";

const Module = require("node:module");

if (typeof Module.enableCompileCache === "function") {
  Module.enableCompileCache = () => ({ status: "DISABLED_BY_RUNNER" });
}

require("../node_modules/eslint/bin/eslint.js");
