process.hrtime = require("browser-process-hrtime")
import StoreBackend from "../../data/StoreBackend"

import { Hypermerge } from "../../modules/hypermerge"
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

const hm = new Hypermerge({ storage: racf })

chrome.runtime.onConnect.addListener(port => {
  hm.ready.then(hm => {
    const store = new StoreBackend(hm, msg => {
      port.postMessage(msg)
    })

    port.onMessage.addListener(msg => {
      store.onMessage(msg)
    })
  })
})
