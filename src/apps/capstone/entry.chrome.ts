import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import swarm from "../../modules/hypermerge/cloud-swarm"
let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")
const webview = window.webview

const hm = new Hypermerge({ storage: racf })
const store = new StoreBackend(hm)

store.queue.subscribe(msg => {
  webview.contentWindow!.postMessage(msg, "*")
})

window.addEventListener("message", event => {
  store.onMessage(event.data)
})

hm.ready.then(hm => {
  store.sendToFrontend({ type: "Ready" })

  swarm(hm, {
    id: hm.core.archiver.changes.id,
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
  })

