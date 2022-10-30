#!/usr/bin/env node

const resolveOptions = { paths: [process.cwd(), __dirname] };

const resolves = {};
["@parcel/config-default"].forEach((package) => {
  resolves[package] = require.resolve(package, resolveOptions);
});

require("../dist/index").cli(process.argv, resolves);
