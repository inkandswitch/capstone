process.hrtime = require("browser-process-hrtime")
import StoreBackground from "../../data/StoreBackground"

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
  initHypermerge({ storage: racf }, (hm: Hypermerge) => {
    let store = new StoreBackground(hm)
    resolve(store)
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  pBackground.then((store: StoreBackground) => store.onMessage(request))
})

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener((changes: any) => {
    pBackground.then((store: StoreBackground) => store.applyChanges(changes, port))
  })
  pBackground.then((store: StoreBackground) => store.onConnect(port))
})
