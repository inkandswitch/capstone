import { Hypermerge } from "../modules/hypermerge"
import * as Prefetch from "../data/Prefetch"
import * as Peek from "./Peek"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"

const Debug = require("debug")
const log = Debug("store:coms")

export default class StoreBackend {
  presenceTick?: NodeJS.Timer
  _send: (msg: Msg.BackendToFrontend) => void
  hypermerge: Hypermerge
  docHandles: { [docId: string]: any } = {}
  pendingChanges: { [docId: string]: any } = {}
  //debugLogs: { [docId: string]: any } = {}
  //  prefetcher: Prefetch.Prefetcher

  constructor(hm: Hypermerge, send: (msg: Msg.BackendToFrontend) => void) {
    this.hypermerge = hm
    this._send = send
    ;(global as any).hm = this.hypermerge
    ;(global as any).sm = this

    Peek.enable()
  }

  applyChanges = (docId: string, changes: any) => {
    const handle = this.docHandles[docId]

    if (handle) {
      handle.applyChanges(changes)
    } else {
      this.pendingChanges[docId] = (this.pendingChanges[docId] || []).concat([
        changes,
      ])
    }
  }

  startPresence() {
    const hm = this.hypermerge

    this.presenceTick = setInterval(() => {
      let message: Msg.Presence = {
        type: "Presence",
        errs: hm.errs.map(e => e.toString()),
        docs: {},
        peers: {},
      }

      for (const docId in this.docHandles) {
        const handle = this.docHandles[docId]
        const connections = handle.connections()

        message.docs[docId] = message.docs[docId] || {
          connections: 0,
          peers: {},
        }
        message.docs[docId].connections = connections.length

        handle.peers().forEach((peer: any) => {
          const id = peer.identity as string

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

      this.sendToFrontend(message)
    }, 5000)
  }

  stopPresence() {
    if (this.presenceTick != null) clearInterval(this.presenceTick)
  }

  reset() {
    this.stopPresence()

    Object.values(this.docHandles).forEach(handle => {
      handle.release()
    })

    this.docHandles = {}
  }

  onMessage = (msg: Msg.FrontendToBackend) => {
    switch (msg.type) {
      case "Open": {
        const { docId } = msg

        if (this.docHandles[docId])
          throw new Error("Frontend opened a doc twice")

        const handle = this.hypermerge.openHandle(docId)
        this.docHandles[docId] = handle
        // IMPORTANT: the handle must be cached in `this.docHandles` before setting the onChange
        // callback. The `onChange` callback is invoked as soon as it is set, in the same tick.
        // This can cause infinite loops if the handlesCache isn't set.
        // setImmediate(() => handle.onChange(this.prefetcher.onDocumentUpdate))

        if (this.pendingChanges[docId]) {
          this.pendingChanges[docId].forEach((change: any) =>
            handle.applyChanges(change),
          )
          this.pendingChanges[docId] = []
        }

        handle.on("patch", (patch: any) => {
          const actorId = handle.actorId

          this.sendToFrontend({ type: "Patch", docId, actorId, patch })
        })

        break
      }

      case "ChangeRequest": {
        const { docId, changes } = msg
        this.applyChanges(docId, changes)
        break
      }

      case "RequestActivity": {
        const { docId } = msg

        const hm = this.hypermerge
        const actorIds: string[] = hm.docIndex[docId] || []

        actorIds.forEach(actorId => {
          const feed = hm._feed(actorId)

          const ondownload = (seq: number) => {
            this.sendToFrontend({
              type: "Download",
              actorId,
              seq,
            })
          }

          const onupload = (seq: number) => {
            this.sendToFrontend({
              type: "Upload",
              actorId,
              seq,
            })
          }

          feed.on("download", ondownload)
          feed.on("upload", onupload)

          // TODO: reimplement this:
          // port.onDisconnect.addListener(() => {
          //   feed.off("download", ondownload)
          //   feed.off("upload", onupload)
          // })
        })
        break
      }

      case "Create": {
        const { keys } = msg
        let keyPair = {
          publicKey: Base58.decode(keys.publicKey),
          secretKey: Base58.decode(keys.secretKey),
        }
        this.hypermerge.create(keyPair)
        break
      }

      case "SetIdentity": {
        const { identityUrl } = msg
        this.hypermerge.setIdentity(identityUrl)
        break
      }
    }
  }

  sendToFrontend(msg: Msg.BackendToFrontend) {
    this._send(msg)
  }
}

function add<T>(array: Array<T>, element: T) {
  array.includes(element) ? null : array.push(element)
}
