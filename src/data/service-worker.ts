import StoreBackend from "./StoreBackend"

let store = new StoreBackend()

self.addEventListener("install", function(event) {
  // Perform install steps
  console.log("Install hook")
})

self.addEventListener("message", event => {
  let { command, args = {} } = event.data
  let { id, doc } = args
  switch (command) {
    case "Create":
      store.create().then(doc => event.ports[0].postMessage(doc))
      break
    case "Open":
      store.open(id).then(doc => event.ports[0].postMessage(doc))
      break
    case "Replace":
      return (this.docs[id] = doc)
  }
})
