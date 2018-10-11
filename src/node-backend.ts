import * as ws from "ws"

import { Hypermerge } from "./modules/hypermerge"
import swarm from "./modules/hypermerge/cloud-swarm"
import * as Msg from "./data/StoreMsg"
import StoreBackend from "./data/StoreBackend"
import * as Peek from "./data/Peek"

const hm = new Hypermerge({ storage: "./.data" })
;(global as any).hm = hm

const backend = new StoreBackend(hm)

hm.ready.then(() => {
  const sm = swarm(hm, {
    id: hm.core.archiver.changes.id,
    url: "ws://localhost:8080",
  })
  ;(global as any).sm = sm
  Peek.enable()
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
  backend.queue.subscribe((msg: Msg.BackendToFrontend) => {
    conn.send(JSON.stringify(msg))
  })

  conn.on("message", data => {
    backend.onMessage(JSON.parse(data.toString()))
  })

  conn.on("close", () => {
    backend.reset()
    backend.queue.unsubscribe()
    console.error("frontend disconnected")
  })
})
