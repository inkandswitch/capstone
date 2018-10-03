import { Hypermerge } from "../modules/hypermerge"
import * as Prefetch from "../data/Prefetch"
import * as Peek from "./Peek"
import * as Base58 from "bs58"

const Debug = require("debug")
const log = Debug("store:coms")

;(window as any).peek = () => {
  console.log("peek() hasnt loaded yet")
}

export default class StoreBackend {
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any } = {}
  pendingChanges: { [docId: string]: any } = {}
  //debugLogs: { [docId: string]: any } = {}
//  prefetcher: Prefetch.Prefetcher

  constructor(hm: Hypermerge) {
    this.hypermerge = hm
    ;(window as any).hm = this.hypermerge
    ;(window as any).sm = this
    this.hypermerge.joinSwarm({ chrome: true })

    // debugging stuff
    chrome.system.network.getNetworkInterfaces(ifaces => {
      let address = ifaces.filter(i => i.prefixLength == 24)[0].address
      chrome.storage.local.get("deviceAgent", result => {
        this.hypermerge.setDevice(result.deviceAgent || address)
      })
    })
    Peek.enable()
  }

  applyChanges = (changes: any, port: chrome.runtime.Port) => {
    const [docId, _] = port.name.split("/", 2)
    const handle = this.docHandles[docId]
    if (docId.startsWith("98bbA")) { console.log("CHANGE", docId, changes) }
    if (handle) {
      handle.applyChanges(changes)
    } else {
      this.pendingChanges[docId] = (this.pendingChanges[docId] || []).concat([changes])
    }
  }

  onConnect = (port: chrome.runtime.Port) => {
    const [docId, mode = "changes"] = port.name.split("/", 2)

    console.log("connect", docId)

    port.onDisconnect.addListener(() => console.log("port discon: ", port.name, chrome.runtime.lastError))

    switch (mode) {
      case "changes": {
        if (!this.docHandles[docId]) {
          const handle = this.hypermerge.openHandle(docId)
          this.docHandles[docId] = handle
          // IMPORTANT: the handle must be cached in `this.docHandles` before setting the onChange
          // callback. The `onChange` callback is invoked as soon as it is set, in the same tick.
          // This can cause infinite loops if the handlesCache isn't set.
          // setImmediate(() => handle.onChange(this.prefetcher.onDocumentUpdate))
        }
        const handle = this.docHandles[docId]

        if (this.pendingChanges[docId]) {
          this.pendingChanges[docId].forEach((change : any)=> handle.applyChanges(change))
          this.pendingChanges[docId] = []
        }

        handle.on("patch", (patch: any) => {
          const actorId = handle.actorId
          if (docId.startsWith("98bbA")) { console.log("PATCH", docId, actorId, patch) }
          port.postMessage({ actorId, patch })
        })

        port.onDisconnect.addListener(() => handle.release())

        break
      }

      case "presence": {
        const hm = this.hypermerge
        const actorIds: string[] = hm.docIndex[docId] || []

        const tick = setInterval(() => {
          let message: any = {
            errs: hm.errs.map(e => e.toString()),
            docs: {},
            peers: {},
          }
          const add: Function = (array: Array<any>, element: any) =>
            array.includes(element) ? null : array.push(element)
          for (const docId in this.docHandles) {
            const handle = this.docHandles[docId]
            const connections = handle.connections()

            message.docs[docId] = message.docs[docId] || {
              connections: 0,
              peers: [],
            }
            message.docs[docId].connections = connections.length

            const peers = handle.peers().map((peer: any) => {
              const id = peer.identity
              message.peers[id] = message.peers[id] || {
                devices: [],
                docs: [],
                lastSeen: 0,
              }
              add(message.docs[docId].peers, id)
              add(message.peers[id].devices, peer.device)
              add(message.peers[id].docs, docId)
              message.peers[id].lastSeen = Math.max(
                message.peers[id].lastSeen,
                peer.synTime,
              )
            })
          }
          port.postMessage(message)
        }, 5000)

        port.onDisconnect.addListener(() => clearInterval(tick))

        break
      }

      case "activity": {
        const hm = this.hypermerge
        const actorIds: string[] = hm.docIndex[docId] || []

        actorIds.forEach(actorId => {
          const feed = hm._feed(actorId)

          const ondownload = (seq: number) => {
            port.postMessage({
              type: "Download",
              actorId,
              seq,
            })
          }


          const onupload = (seq: number) => {
            port.postMessage({
              type: "Upload",
              actorId,
              seq,
            })
          }

          feed.on("download", ondownload)
          feed.on("upload", onupload)

          port.onDisconnect.addListener(() => {
            feed.off("download", ondownload)
            feed.off("upload", onupload)
          })
        })
        break
      }
    }
  }

  onMessage = ( request: any ) => {
    let { command, args } = request

    switch (command) {
      case "Create":
        const { keys } = args
        let keyPair = { publicKey: Base58.decode(keys.publicKey), secretKey: Base58.decode(keys.secretKey) }
        this.hypermerge.create(keyPair)
        break
      case "SetIdentity":
        const { identityUrl } = args
        console.log("Identity", identityUrl)
        this.hypermerge.setIdentity(identityUrl)
        break
      default:
        console.warn("Received an unusual message: ", request)
    }
//    return true // indicate we will respond asynchronously
  }
}
