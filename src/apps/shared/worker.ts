import Queue from "../../data/Queue"
import * as Msg from "../../data/StoreMsg"
let racf = require("random-access-chrome-file")

import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import CloudClient from "../../modules/discovery-cloud/Client"

process.hrtime = require("browser-process-hrtime")

hm.joinSwarm(
  new CloudClient({
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
    id: hm.id,
    stream: hm.stream,
  }),
)

window.addEventListener("message", ({ data: msg }) => {
  if (typeof msg !== "object") return

  console.log(msg)

  if (msg.type === "Clipper") {
    return store.sendToFrontend(msg)
  }

  if (msg.type === "ToggleDebug") {
    toggleDebug()
  }

  store.onMessage(msg)
})
