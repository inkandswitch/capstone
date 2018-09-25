import { Hypermerge } from "../modules/hypermerge"
import * as Prefetch from "../data/Prefetch"

const Debug = require("debug")
const log = Debug("store:coms")

let DebugDocs : any = {}
let global : any = window;
global.docs = (id : any, flags = "") => {
  if (id) {
    for (let docId in global.sm.docHandles) {
      if (docId.startsWith(id)) {
          // copy to clipboard
          let handle = global.sm.docHandles[docId]

          if (flags.includes("c")) {
            const el = document.createElement('textarea');
            el.value = JSON.stringify(global.sm.debugLogs[docId])
            const len = el.value.length
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            console.log(`%c ${len} characters copied to clipboard`, "color: green");
          }

          if (flags.includes("j")) {
            console.log(handle.toString(4))
          }

          // doc detail
          console.log("DocId: - %c " + docId, "color: blue")
          //console.log(JSON.parse(handle.toString(4)))
          console.log("ActorIds:", handle.__actorIds())
          let peers = handle.__actorIds().reduce((acc : any,id: any) => acc.concat(global.hm._trackedFeed(id).peers),[])
          console.log("Peers:", peers)
      }
    }
  } else {
    for (let docId in global.sm.docHandles) {
      let handle = global.sm.docHandles[docId]
      let body = handle.toString()
      let peers = handle.__actorIds().reduce((acc: any,id: any) => acc.concat(global.hm._trackedFeed(id).peers),[])
      if (body.length > 40) body = body.slice(0,37) + "..."
      console.log(docId.slice(0,5) + " : " + peers.length + " peers, '" + body + "'")
      console.log("USAGE:")
      console.log(" docs(docid) - get detailed info on a doc")
      console.log(" docs(docid, 'j') - also include a json dump of the document")
      console.log(" docs(docid, 'c') - also copy automerge history to clipboard")
      console.log(" docs(docid, 'jc') - do both")
    }
  }
}

export default class StoreComms {
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any } = {}
  debugLogs: { [docId: string]: any } = {}
  prefetcher: Prefetch.Prefetcher

  constructor(hm: Hypermerge) {
    this.hypermerge = hm
    ;(window as any).hm = this.hypermerge
    ;(window as any).sm = this
    this.hypermerge.joinSwarm({ chrome: true })
    this.prefetcher = new Prefetch.Prefetcher(this.hypermerge, this.docHandles)
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
          this.debugLogs[docId] = this.debugLogs[docId] || [{docId}]
          this.debugLogs[docId].push({ changes })
          log("applyChanges", changes)
        })

        handle.onPatch((patch: any) => {
          log("patch", patch)
          const actorId = handle.actorId
          this.debugLogs[docId] = this.debugLogs[docId] || [{docId}]
          this.debugLogs[docId].push({ patch })
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
