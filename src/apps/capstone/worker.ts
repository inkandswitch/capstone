import * as Debug from "debug"
Debug.enable(self.name)

import StoreBackend from "capstone/StoreBackend"
import { Hypermerge } from "hypermerge"
import CloudClient from "discovery-cloud/Client"

process.hrtime = require("browser-process-hrtime")

let rawf = require("random-access-worker-file")

const hm = new Hypermerge({ storage: rawf })
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
