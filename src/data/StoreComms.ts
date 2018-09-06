import StoreBackend from "./StoreBackend"

export default class StoreComms {
  store: StoreBackend
  docHandles: { [docId: string]: any }

  constructor(store: StoreBackend) {
    this.store = store
  }

  onConnect = (port: chrome.runtime.Port) => {
    const docId = port.name
    console.log(docId)
    let handle = this.store.open(docId)

    port.onMessage.addListener((
      newDoc: any /* chrome.runtime.PortMessageEvent */,
    ) => {
      handle.change((oldDoc: any) => {
        for (let key in newDoc) {
          oldDoc[key] = newDoc[key] as any
        }
      })
    })

    handle.onChange((doc: any) => port.postMessage(doc))
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

    console.log("onmessage", { request })

    switch (command) {
      case "Create":
        this.store.create().then(id => sendResponse(id))
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
