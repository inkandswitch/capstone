process.hrtime = require("browser-process-hrtime")
import StoreComms from "../../data/StoreComms"

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

let pComms = new Promise((resolve) => {
  initHypermerge({ storage: racf }, (hm: Hypermerge) => {
    let comms = new StoreComms(hm)
    resolve(comms)
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  pComms.then((comms: StoreComms) => comms.onMessage(request, sendResponse))
  return true // this allows sendReponse to respond async - DO NOT REMOVE
})

chrome.runtime.onConnect.addListener(port => {
  pComms.then((comms: StoreComms) => comms.onConnect(port))
})
