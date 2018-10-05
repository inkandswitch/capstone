import * as ws from "ws"

import { Hypermerge } from "./modules/hypermerge"
import swarm from "./modules/hypermerge/discovery-swarm"
import * as Msg from "./data/StoreMsg"
import StoreBackend from "./data/StoreBackend"
import * as Peek from "./data/Peek"
let mdns = require("multicast-dns")

const hm = new Hypermerge({ storage: "./.data" })
;(global as any).hm = hm

hm.ready.then(() => {
  const multicast = mdns({
    port: 8008,
  })

  const sm = swarm(hm, {
    port: 5000,
    dns: { multicast },
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
