import StoreBackend from "./StoreBackend"

class ServiceWorker {
let store = new StoreBackend()

self.addEventListener("install", function(event) {
  // Perform install steps
  console.log("Install hook")
})

self.addEventListener("message", event => {
  let { command, id, doc } = event.data
  switch (command) {
    case "Create":
      store.create().then((doc) => event.ports[0].postMessage(doc) )
    case "OpenDoc":
      return event.ports[0].postMessage(store.open(id))
    case "Update":
      return (this.docs[id] = doc)
  }
})
}