let raidb = require("random-access-idb")

import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import CloudClient from "../../modules/discovery-cloud/Client"

process.hrtime = require("browser-process-hrtime")

const hm = new Hypermerge({ storage: raidb("hypermerge") })
const store = new StoreBackend(hm)

hm.joinSwarm(
  new CloudClient({
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
    id: hm.id,
    stream: hm.stream,
  }),
)

addEventListener("message", ({ data: msg }) => {
  if (typeof msg !== "object") return

  store.onMessage(msg)
})

store.sendQueue.subscribe(msg => {
  ;(postMessage as any)(msg)
})
