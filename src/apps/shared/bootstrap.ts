import Store from "../../data/Store"

export default (store: Store) => {
  const worker = new Worker("worker.js") as any

  store.sendQueue.subscribe(msg => {
    console.log("sending to worker", msg)
    worker.postMessage(msg)
  })

  worker.addEventListener("message", (event: MessageEvent) => {
    console.log("msg from worker", event.data)
    if (typeof event.data === "string") return // setImmediate uses postMessage
    store.onMessage(event.data)
  })
}
