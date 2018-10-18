const global = self as any

// HACK to enable random-access-chrome-file
const fakePersistentStorage = {
  queryUsageAndQuota(cb: (used: number, quota: number) => void) {
    cb(0, Number.MAX_SAFE_INTEGER)
  },
  requestQuota(_bytes: number, cb: (quota: number) => void) {
    cb(Number.MAX_SAFE_INTEGER)
  },
}

global.navigator.webkitPersistentStorage = fakePersistentStorage

global.window = global

let racf = require("random-access-chrome-file")

import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import CloudClient from "../../modules/discovery-cloud/Client"

process.hrtime = require("browser-process-hrtime")

const hm = new Hypermerge({ storage: racf })
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
