#!/usr/bin/env node
"use strict";

const Module = require("node:module");

// Отключаем кеш компиляции, если метод доступен
if (typeof Module.enableCompileCache === "function") {
  Module.enableCompileCache = () => ({ status: "DISABLED_BY_RUNNER" });
}

require("eslint/bin/eslint.js");