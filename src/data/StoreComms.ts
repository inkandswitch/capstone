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
    sendResponse: Function,
  ) => {
    let { command } = request

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
