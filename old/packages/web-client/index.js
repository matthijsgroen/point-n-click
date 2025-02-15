const path = require("path");

module.exports = {
  getContentFolder: () => path.join(__dirname, "build"),
};
