import Store from "../../data/Store"
import * as Msg from "../../data/StoreMsg"
import Queue from "../../data/Queue"
import Content from "../../components/Content"

const store = new Store()
const worker = new Worker("worker.js") as any
const entryQueue = new Queue<Msg.MainToEntry>()

// Used for debugging from the console:
window.Content = Content
Content.store = store

window.sendToEntry = (msg: Msg.MainToEntry) => {
  entryQueue.push(msg)
}

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

      entryQueue.subscribe(msg => {
        source.postMessage(msg, "*")
      })
      break
    }
  }
})
