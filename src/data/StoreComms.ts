import { Hypermerge } from "../modules/hypermerge"
import * as Prefetch from "../data/Prefetch"
import * as Peek from "./Peek"

const Debug = require("debug")
const log = Debug("store:coms")

export default class StoreComms {
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any } = {}
  //debugLogs: { [docId: string]: any } = {}
  prefetcher: Prefetch.Prefetcher

  constructor(hm: Hypermerge) {
    this.hypermerge = hm
    ;(window as any).hm = this.hypermerge
    ;(window as any).sm = this
    this.hypermerge.joinSwarm({ chrome: true })
    this.prefetcher = new Prefetch.Prefetcher(this.hypermerge, this.docHandles)
    Peek.enable()
  }

  onConnect = (port: chrome.runtime.Port) => {
    const [docId, mode = "changes"] = port.name.split("/", 2)
    log("connect", docId)

    switch (mode) {
      case "changes": {
        if (!this.docHandles[docId]) {
          const handle = this.hypermerge.openHandle(docId)
          this.docHandles[docId] = handle
          // IMPORTANT: the handle must be cached in `this.docHandles` before setting the onChange
          // callback. The `onChange` callback is invoked as soon as it is set, in the same tick.
          // This can cause infinite loops if the handlesCache isn't set.
          setImmediate(() => handle.onChange(this.prefetcher.onDocumentUpdate))
        }
        const handle = this.docHandles[docId]

        port.onMessage.addListener((changes: any) => {
          handle.applyChanges(changes)
//          this.debugLogs[docId] = this.debugLogs[docId] || [{docId}]
//          this.debugLogs[docId].push({ changes })
          log("applyChanges", changes)
        })

        handle.onPatch((patch: any) => {
          log("patch", patch)
          const actorId = handle.actorId
//          this.debugLogs[docId] = this.debugLogs[docId] || [{docId}]
//          this.debugLogs[docId].push({ patch })
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
    let { command, args } = request

    switch (command) {
      case "Create":
        let doc = this.hypermerge.create()
        let docId = this.hypermerge.getId(doc)
        sendResponse(docId)
        break
      case "SetIdentity":
        const { identityUrl } = args
        console.log("Identity", identityUrl)
        // TODO
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
    return true // indicate we will respond asynchronously
  }
}
