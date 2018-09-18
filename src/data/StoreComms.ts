import Hypermerge from "../modules/hypermerge"
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
    const [docId, mode = "changes"] = port.name.split("/", 2)

    switch (mode) {
      case "changes": {
        const handle = this.hypermerge.openHandle(docId)
        port.onMessage.addListener((newDoc: any) => {
          handle.change((oldDoc: any) => {
            for (let key in newDoc) {
              oldDoc[key] = newDoc[key] as any
            }
          })
        })

        handle.onChange((doc: any) => {
          port.postMessage(doc)
        })
        break
      }

      case "activity": {
        const hm = this.hypermerge
        hm.ready.then(() => {
          const actorIds: string[] = hm.docIndex[docId] || []

          actorIds.forEach(actorId => {
            const feed = hm._feed(actorId)

            feed.on("download", (seq: number) => {
              port.postMessage({
                type: "Download",
                actorId,
                seq,
              })
            })

            feed.on("upload", (seq: number) => {
              port.postMessage({
                type: "Upload",
                actorId,
                seq,
              })
            })
          })
        })
        break
      }
    }
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
