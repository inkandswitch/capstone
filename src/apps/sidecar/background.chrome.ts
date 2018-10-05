process.hrtime = require("browser-process-hrtime")
import StoreBackend from "../../data/StoreBackend"

import { Hypermerge, initHypermerge } from "../../modules/hypermerge"
let racf = require("random-access-chrome-file")

chrome.app.runtime.onLaunched.addListener(() => {
  chrome.app.window.create(
    "index.html",
    {
      id: "main",
      frame: "chrome",
      resizable: true,
    },
    win => {
      win.show(true) // Passing focused: true
    },
  )
})
