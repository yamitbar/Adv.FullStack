// Custom, cross-platform test runner entry point. Node's own `node --test
// <directory>` CLI argument handling proved inconsistent across
// environments, so this explicitly lists every *.test.js file in this
// directory and runs them via the programmatic node:test API instead -
// works the same way regardless of OS/shell (no glob expansion needed).
const { run } = require("node:test");
const { spec } = require("node:test/reporters");
const path = require("path");
const fs = require("fs");

const testsDir = __dirname;

const files = fs
  .readdirSync(testsDir)
  .filter((file) => file.endsWith(".test.js"))
  .map((file) => path.join(testsDir, file));

let anyTestFailed = false;

const stream = run({ files });

stream.on("test:fail", () => {
  anyTestFailed = true;
});

stream.compose(spec).pipe(process.stdout);

stream.once("end", () => {
  process.exitCode = anyTestFailed ? 1 : 0;
});
