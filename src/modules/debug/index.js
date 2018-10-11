if (chrome && chrome.storage) {
  console.log("using chrome-debug")
  module.exports = require("chrome-debug")
} else {
  console.log("using normal debug")
  module.exports = require("../../../node_modules/debug")
}
