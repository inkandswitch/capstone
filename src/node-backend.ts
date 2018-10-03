import * as ws from "ws"

import { Hypermerge } from "./modules/hypermerge"
import * as Msg from "./data/StoreMsg"
import StoreBackend from "./data/StoreBackend"

const hm = new Hypermerge({ storage: "./.data" })
;(global as any).hm = hm

hm.ready.then(() => {
  hm.joinSwarm()
})

const server = new ws.Server({
  host: "localhost",
  port: 8085,
})

server.on("listening", () => {
  console.log("Backend listening")
})

server.on("connection", conn => {
  console.log("[Backend]: connection")
  const backend = new StoreBackend(hm, (msg: Msg.BackendToFrontend) => {
    conn.send(JSON.stringify(msg))
  })

  conn.on("message", data => {
    backend.onMessage(JSON.parse(data.toString()))
  })

  conn.on("close", () => {
    backend.reset()
    console.error("frontend disconnected")
  })
})
