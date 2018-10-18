import Store from "../../data/Store"

export default (store: Store) => {
  const worker = new Worker("worker.js") as any

  worker.onchange = () => {
    store.sendQueue.subscribe(msg => {
      worker.postMessage(msg, "*")
    })
  }

  window.addEventListener("message", event => {
    if (typeof event.data === "string") return // setImmediate uses postMessage
    store.onMessage(event.data)
  })
}
