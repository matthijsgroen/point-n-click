const { Resolver } = require("@parcel/plugin");

const options = { paths: [process.cwd()] };

const skipBuiltins = ["events"];

module.exports = new Resolver({
  async resolve({ specifier }) {
    if (skipBuiltins.includes(specifier)) {
      return null;
    }
    try {
      const path = require.resolve(specifier, options);
      return {
        filePath: path,
      };
    } catch (e) {
      return null;
    }
  },
});
