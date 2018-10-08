process.hrtime = require("browser-process-hrtime")
import StoreBackend from "../../data/StoreBackend"

import { Hypermerge, initHypermerge } from "../../modules/hypermerge"
let racf = require("random-access-chrome-file")

let mainWindow: chrome.app.window.AppWindow
let clipperPort: chrome.runtime.Port

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

chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (sender.id == "blocklistedExtension") return

    console.log("Received message from external extension", request, sender)

    if (!clipperPort) return

    clipperPort.postMessage({ request, sender })

    sendResponse({ contentReceived: "success" })
  },
)

let pBackend = new Promise(resolve => {
  initHypermerge({ storage: racf }, (hm: Hypermerge) => {
    const store = new StoreBackend(hm)
    resolve(store)
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  pBackend.then((store: StoreBackend) => {
    store.onMessage(request)
  })
})

chrome.runtime.onConnect.addListener(port => {
  if (port.name === "clipper") {
    clipperPort = port
    return
  }

  port.onMessage.addListener((changes: any) => {
    pBackend.then((store: StoreBackend) => store.applyChanges(changes, port))
  })

  pBackend.then((store: StoreBackend) => store.onConnect(port))
})
