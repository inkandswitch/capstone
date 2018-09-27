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

    // debugging stuff
    chrome.system.network.getNetworkInterfaces(ifaces => {
      let address = ifaces.filter(i => i.prefixLength == 24)[0].address
      chrome.storage.local.get("deviceAgent", (result) => {
        this.hypermerge.setDevice( result.deviceAgent || address )
      })
    })
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

      case "presence": {
        const hm = this.hypermerge
        const actorIds: string[] = hm.docIndex[docId] || []

        setInterval(() => {
          let message : any = {
            docs : {},
            peers: {}
          }
          const add : Function = (array : Array<any>, element : any) => array.includes(element) ? null : array.push(element)
          for (const docId in this.docHandles) {
            const handle = this.docHandles[docId]
            const connections = handle.connections()

            message.docs[docId] = message.docs[docId] || { connections: 0, peers: [] }
            message.docs[docId].connections = connections.length

            const peers = handle.peers().map( (peer : any) => {
              const id = peer.identity
              message.peers[id] = message.peers[id] || {
                devices : [],
                docs : [],
                lastSeen : 0
              }
              add(message.docs[docId].peers, id)
              add(message.peers[id].devices, peer.device)
              add(message.peers[id].docs, docId)
              message.peers[id].lastSeen = Math.max(message.peers[id].lastSeen, peer.synTime)
            })
          }
          port.postMessage(message)
        }, 5000)

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
        this.hypermerge.setIdentity( identityUrl )
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
    return true // indicate we will respond asynchronously
  }
}
