import * as ws from "ws"

import { Hypermerge } from "hypermerge"
import { Msg } from "capstone"
import StoreBackend from "capstone/StoreBackend"
import CloudClient from "discovery-cloud/Client"

const hm = new Hypermerge({ path: "./.data" })
;(global as any).hm = hm

const backend = new StoreBackend(hm)

hm.ready.then(() => {
  hm.joinSwarm(
    new CloudClient({
      //url: "wss://discovery-cloud.herokuapp.com",
      url: "ws://localhost:8080",
      id: hm.id,
      stream: hm.stream,
    }),
  )
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
  backend.sendQueue.subscribe((msg: Msg.BackendToFrontend) => {
    conn.send(JSON.stringify(msg))
  })

  conn.on("message", data => {
    backend.onMessage(JSON.parse(data.toString()))
  })

  conn.on("close", () => {
    backend.reset()
    backend.sendQueue.unsubscribe()
    console.error("frontend disconnected")
  })
})
