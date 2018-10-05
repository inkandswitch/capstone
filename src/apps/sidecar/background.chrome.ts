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

let pBackground = new Promise(resolve => {
  new Hypermerge({ storage: racf }).ready.then(hm => {
    let store = new StoreBackend(hm, msg => {
      chrome.runtime
    })
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  pBackground.then((store: StoreBackend) => store.onMessage(request))
})

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((changes: any) => {
    pBackground.then((store: StoreBackend) => store.applyChanges(changes, port))
  })
  pBackground.then((store: StoreBackend) => store.onConnect(port))
})
