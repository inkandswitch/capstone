import { Hypermerge } from "../modules/hypermerge"

const Debug = require("debug")
const log = Debug("store:coms")

export default class StoreComms {
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any }

  constructor(hm: Hypermerge) {
      this.hypermerge = hm
      ;(window as any).hm = this.hypermerge
      this.hypermerge.joinSwarm({ chrome: true })
  }

  onConnect = (port: chrome.runtime.Port) => {
    const docId = port.name
    console.log("PORT",port.name,port);
    log("connect",docId);
    let handle = this.hypermerge.openHandle(docId)

    port.onMessage.addListener((changes: any) => {
      handle.applyChanges(changes)
      log("applyChanges",changes);
    })

    handle.onPatch((patch: any) => {
      log("patch",patch)
      const actorId = handle.actorId
      port.postMessage({ actorId, patch })
    })
  }

  onMessage = (
    request: any, // the message can, indeed, be anything
//    sender: chrome.runtime.MessageSender,
    sendResponse: Function,
  ) => {
    // XXX: we should probably check the sender, but it
    //      isn't clear to me how to do so reasonably & robustly
    let { command } = request

    switch (command) {
      case "Create":
        console.log("store:coms CREATE 1")
        let doc = this.hypermerge.create()
        console.log("store:coms CREATE 2",doc)
        let docId = this.hypermerge.getId(doc)
        console.log("store:coms CREATE 3",docId)
        sendResponse(docId)
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
    return true // indicate we will respond asynchronously
  }
}
