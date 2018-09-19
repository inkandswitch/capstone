process.hrtime = require("browser-process-hrtime")
import StoreComms from "./data/StoreComms"

import { Hypermerge, initHypermerge } from "./modules/hypermerge"
let racf = require("random-access-chrome-file")

let mainWindow: chrome.app.window.AppWindow

chrome.app.runtime.onLaunched.addListener(() => {
  chrome.app.window.create(
    "index.html",
    {
      id: "main",
      frame: "chrome",
      state: "fullscreen",
      resizable: true,
      outerBounds: {
        // Half-screen default for development
        // Press "square" key (F3) to toggle
        top: 0,
        left: 0,
        width: screen.width / 2,
        height: screen.height,
      },
    },
    win => {
      mainWindow = win
      chrome.storage.local.get(["disableFullscreen"], result => {
        if (!result.disableFullscreen) {
          win.fullscreen()
        }
      })
      win.show(true) // Passing focused: true
    },
  )
})

let comms : any = null
let pComm = new Promise(resolve => {
  initHypermerge({ storage: racf }, (hm: Hypermerge) => {
    comms = new StoreComms(hm)
    resolve(comms)
    chrome.runtime.sendMessage({ hypercore: "ready"})
  })
})

/*
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("on message")
  comms.onMessage(request, sender, sendResponse)
  // this message must be responded to syncronously :/
})
*/

chrome.runtime.onConnect.addListener(port => {
  if (port.name == "bus") {
    port.onMessage.addListener(({id, request}) => {
      pComm.then(comm => {
        comms.onMessage(request, (response : any) => {
          port.postMessage({ id, response })
        })
      })
    })
  } else {
    pComm.then((comms : StoreComms) => comms.onConnect(port))
  }
})
