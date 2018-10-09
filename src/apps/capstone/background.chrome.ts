import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")

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

const hm = new Hypermerge({ storage: racf })

chrome.runtime.onConnect.addListener(port => {
  hm.ready.then(hm => {
    swarm(hm, {
      id: hm.core.archiver.changes.id,
      url: "wss://discovery-cloud.herokuapp.com",
      // url: "ws://localhost:8080",
    })

    const store = new StoreBackend(hm, msg => {
      port.postMessage(msg)
    })

    port.onMessage.addListener(msg => {
      store.onMessage(msg)
    })
  })
})
