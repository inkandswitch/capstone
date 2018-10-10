import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")

let mainWindow: chrome.app.window.AppWindow | undefined

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
      ;(window as any).win = win
      store.queue.subscribe(msg => {
        win.contentWindow.webview.contentWindow!.postMessage(msg, "*")
      })
    },
  )
})

const hm = new Hypermerge({ storage: racf })
const store = new StoreBackend(hm)

window.addEventListener("message", event => {
  console.log("message", event)
  store.onMessage(event.data)
})

hm.ready.then(hm => {
  store.sendToFrontend({ type: "Ready" })

  swarm(hm, {
    id: hm.core.archiver.changes.id,
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
  })
})
