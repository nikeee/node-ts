var dts = require("dts-bundle");
dts.bundle({
  name: "node-ts",
  removeSource: true,
  main: "build/index.d.ts"
});
