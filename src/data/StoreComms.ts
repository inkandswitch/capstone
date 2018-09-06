import Hypermerge from "../hypermerge"
let racf = require("random-access-chrome-file")

export default class StoreComms {
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any }

  constructor() {
    this.hypermerge = new Hypermerge({ storage: racf })
    ;(window as any).hm = this.hypermerge
    this.hypermerge.ready.then(() => {
      this.hypermerge.joinSwarm({ chrome: true })
    })
  }

  onConnect = (port: chrome.runtime.Port) => {
    const docId = port.name
    console.log(docId)
    let handle = this.hypermerge.openHandle(docId)

    port.onMessage.addListener((
      newDoc: any /* chrome.runtime.PortMessageEvent */,
    ) => {
      console.log("replace", docId, newDoc)
      handle.change((oldDoc: any) => {
        for (let key in newDoc) {
          oldDoc[key] = newDoc[key] as any
        }
      })
    })

    handle.onChange((doc: any) => {
      console.log("onChange", docId, doc)
      port.postMessage(doc)
    })
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
        let doc = this.hypermerge.create()
        let docId = this.hypermerge.getId(doc)
        sendResponse(docId)
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
    return true // indicate we will respond asynchronously
  }
}
