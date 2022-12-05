#!/usr/bin/env node

const resolveOptions = { paths: [process.cwd(), __dirname] };

/**
 * Resolves package path
 *
 * @param {string} packageName
 * @returns {string}
 */
const resolver = (packageName) => require.resolve(packageName, resolveOptions);

require("../dist/index").cli(process.argv, resolver);
