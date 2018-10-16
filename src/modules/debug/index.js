if (chrome && chrome.storage) {
  module.exports = require("chrome-debug")
} else {
  module.exports = require("../../../node_modules/debug")
}
