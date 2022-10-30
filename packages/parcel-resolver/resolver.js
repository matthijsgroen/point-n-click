const { Resolver } = require("@parcel/plugin");

const options = { paths: [process.cwd()] };

module.exports = new Resolver({
  async resolve({ specifier }) {
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
