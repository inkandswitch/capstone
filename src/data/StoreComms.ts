import StoreBackend from "./StoreBackend"

export default class StoreComms {
  store: StoreBackend

  constructor(store: any) {
    this.store = store
  }

  onMessage = (request: any, sender: any, sendResponse: any) => {
    let { command, args = {} } = request
    let { id, doc } = args

    switch (command) {
      case "Create":
        this.store.create().then(id => sendResponse(id))
        break
      case "Open":
        this.store.open(id).then(doc => sendResponse(doc))
        break
      case "Replace":
        return this.store.replace(id, doc)
    }
    return true // indicate we will respond asynchronously
  }
}
