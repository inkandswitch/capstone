import { Hypermerge } from "../modules/hypermerge"
import * as Iterate from "../logic/Iterate"
import * as Link from "../data/Link"

const Debug = require("debug")
const log = Debug("store:coms")

export default class StoreComms {
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any } = {}

  constructor(hm: Hypermerge) {
    this.hypermerge = hm
    ;(window as any).hm = this.hypermerge
    this.hypermerge.joinSwarm({ chrome: true })

    this.hypermerge.addListener("document:updated", (docId, doc) => {
      console.log(doc)
      // Need a front object :/
      const openIfLink = (val: any) => {
        console.log(val)
        if (Iterate.isString(val)) {
          let id
          try {
            id = Link.parse(val).id
          } catch {
            return
          }
          const handles = this.hypermerge.handles[id]
          if (!handles || !handles.length) {
            console.log("OPENING ID", id)
            this.hypermerge.openHandle(id)
          } else {
            console.log("ALREADY OPEN", id)
          }
        }
      }

      if (!this.docHandles[docId]) {
        // Hack to set up front
        const handle = this.hypermerge.openHandle(docId)
        handle._isManagingFront = true
        handle._setupFront()
        this.docHandles[docId] = handle
      }
      const handle = this.docHandles[docId]
      Iterate.recursive(handle._front, openIfLink)
    })
  }

  onConnect = (port: chrome.runtime.Port) => {
    const [docId, mode = "changes"] = port.name.split("/", 2)
    log("connect", docId)

    switch (mode) {
      case "changes": {
        let handle = this.hypermerge.openHandle(docId)

        port.onMessage.addListener((changes: any) => {
          handle.applyChanges(changes)
          log("applyChanges", changes)
        })

        handle.onPatch((patch: any) => {
          log("patch", patch)
          const actorId = handle.actorId
          port.postMessage({ actorId, patch })
        })
        break
      }

      case "activity": {
        const hm = this.hypermerge
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
        break
      }
    }
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
