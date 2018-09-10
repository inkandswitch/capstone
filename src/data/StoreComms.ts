import Hypermerge from "../hypermerge"
let racf = require("random-access-chrome-file")

const Debug = require("debug")
const log = Debug("store:coms")

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
    log("connect",docId);
    let handle = this.hypermerge.openHandle(docId)

    port.onMessage.addListener((changes: any) => {
      handle.applyChanges(changes)
      log("applyChanges",changes);
      //port.postMessage(patch)
    })

    handle.onPatch((patch: any) => {
      log("patch",patch);
      port.postMessage(patch)
    })
  }

  onMessage = (
    request: any, // the message can, indeed, be anything
    sender: chrome.runtime.MessageSender,
    sendResponse: Function,
  ) => {
    // XXX: we should probably check the sender, but it
    //      isn't clear to me how to do so reasonably & robustly
    let { command } = request

    switch (command) {
      case "Create":
        this.hypermerge.ready.then(() => {
          let doc = this.hypermerge.create()
          let docId = this.hypermerge.getId(doc)
          sendResponse(docId)
        })
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
    return true // indicate we will respond asynchronously
  }
}
