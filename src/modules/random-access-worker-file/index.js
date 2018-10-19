// HACK to enable random-access-chrome-file
const fakePersistentStorage = {
  queryUsageAndQuota(cb) {
    cb(0, Number.MAX_SAFE_INTEGER)
  },
  requestQuota(_bytes, cb) {
    cb(Number.MAX_SAFE_INTEGER)
  },
}

self.navigator.webkitPersistentStorage = fakePersistentStorage

self.window = self

module.exports = require("random-access-chrome-file")
