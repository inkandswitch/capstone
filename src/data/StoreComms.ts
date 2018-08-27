import StoreBackend from "./StoreBackend"

export default class StoreComms {
  store: StoreBackend

  constructor(store: StoreBackend) {
    this.store = store
  }

  onMessage = (
    request: any, // the message can, indeed, be anything
    sender: chrome.runtime.MessageSender,
    sendResponse: Function,
  ) => {
    // XXX: we should probably check the sender, but it
    //      isn't clear to me how to do so reasonably & robustly
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
        this.store.replace(id, doc)
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
    return true // indicate we will respond asynchronously
  }
}
