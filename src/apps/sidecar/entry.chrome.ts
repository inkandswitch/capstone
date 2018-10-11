import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")

const webview = document.getElementById("webview")! as HTMLIFrameElement
const DebugPane = document.getElementById("DebugPane")!

const hm = new Hypermerge({ storage: racf })
const store = new StoreBackend(hm)

store.queue.subscribe(msg => {
  webview.contentWindow!.postMessage(msg, "*")
})

window.addEventListener("message", event => {
  if (event.data.type === "ToggleDebug") {
    toggleDebug()
  }

  store.onMessage(event.data)
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    toggleDebug()
  }
})

hm.ready.then(hm => {
  store.sendToFrontend({ type: "Ready" })

  swarm(hm, {
    id: hm.core.archiver.changes.id,
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
  })
})

webview.addEventListener("loadstop", () => webview.focus())

function toggleDebug() {
  console.log("Toggling debug pane")
  DebugPane.style.display =
    DebugPane.style.display === "block" ? "none" : "block"
}
