import * as Debug from "debug"
const log = Debug("main")

import Store from "../../data/Store"
import * as Msg from "../../data/StoreMsg"
import Queue from "../../data/Queue"
import Content from "../../components/Content"
import { setupControlPanel, toggleControl } from "./control"

const store = new Store()
const worker = new (Worker as any)("worker.js", { name: localStorage.debug || ''}) as any // only way I could find to get debug enabled for boot debug messages

// Used for debugging from the console:
window.Content = Content
Content.store = store

store.sendQueue.subscribe(msg => {
  worker.postMessage(msg)
})

worker.addEventListener("message", (event: MessageEvent) => {
  if (typeof event.data !== "object") return // setImmediate uses postMessage
  store.onMessage(event.data)
})

addEventListener("message", event => {
  if (typeof event.data !== "object") return
  const msg: Msg.EntryToMain = event.data

  switch (msg.type) {
    case "Clipper":
      store.onMessage(msg)
      break

    case "Ready": {
      const { source }: any = event

      break
    }
  }
})

window.addEventListener("load", event => {
  setupControlPanel(store)
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    toggleControl()
  }
})
