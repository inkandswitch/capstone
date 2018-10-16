import * as Debug from "debug"
import { Change, Patch } from "automerge/backend"
import { BackendHandle } from "../modules/picomerge/backend"
import { Hypermerge } from "../modules/picomerge"
import * as Peek from "./Peek"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"
import Queue from "./Queue"

const log = Debug("store:backend")

export default class StoreBackend {
  sendQueue = new Queue<Msg.BackendToFrontend>()
  //presenceTick?: any
  hypermerge: Hypermerge
  docHandles: { [docId: string]: BackendHandle } = {}
  changeQ: { [docId: string]: Queue<Change[]> } = {}

  constructor(hm: Hypermerge) {
    log("constructing")
    this.hypermerge = hm
    ;(global as any).hm = this.hypermerge
    ;(global as any).sm = this
    Peek.enable()
  }

  applyChanges = (docId: string, changes: Change[]) => {
    this.changeQ[docId] = this.changeQ[docId] || new Queue()
    this.changeQ[docId]!.push(changes)
/*
    if (handle) {
      handle.applyChanges(changes)
    } else {
      this.pendingChanges[docId] = (this.pendingChanges[docId] || []).concat([
        changes,
      ])
    }
*/
  }

/*
  startPresence() {
    const hm = this.hypermerge

    this.presenceTick = setInterval(() => {
      let message: Msg.Presence = {
        type: "Presence",
//        errs: hm.errs.map(e => e.toString()),
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
*/

  reset() {
//    this.stopPresence()

    Object.values(this.docHandles).forEach(handle => {
      handle.release()
    })

    this.docHandles = {}
  }

  sendToFrontend(msg: Msg.BackendToFrontend) {
    this.sendQueue.push(msg)
  }

  onMessage = (msg: Msg.FrontendToBackend) => {
    log("message from frontend", msg)

    switch (msg.type) {
      case "Open": {
        const { docId } = msg

        if (this.docHandles[docId])
          throw new Error("Frontend opened a doc twice")

        const handle = this.hypermerge.openDocument(docId)
        this.docHandles[docId] = handle

        this.changeQ[docId] = this.changeQ[docId] || new Queue()
        this.changeQ[docId].subscribe(changes => handle.applyLocalChanges(changes))

        handle.on("actorId", actorId => {
          this.sendToFrontend({ type: "SetActorId", docId, actorId })
        })

        handle.on("ready", (actorId,patch) => {
          this.sendToFrontend({ type: "DocReady", docId, actorId, patch })
        })

        handle.on("localpatch", patch => {
          // dont send - uselss re-render
        })

        handle.on("patch", patch => {
          const actorId = handle.actorId
          this.sendToFrontend({ type: "ApplyPatch", docId, patch })
        })

        break
      }

      case "ChangeRequest": {
        const { docId, changes } = msg
        const handle = this.docHandles[docId]
        handle.applyLocalChanges(changes)
        break
      }

      case "ActorIdRequest": {
        const { docId } = msg
        const handle = this.docHandles[docId]
        handle.initActor()
        break
      }

      case "RequestActivity": {
        const { docId } = msg

        const handle = this.hypermerge.openDocument(docId)
        this.docHandles[docId] = handle

        const actorIds = handle.actorIds()

        actorIds.forEach(actorId => {
          const feed = this.hypermerge.feed(actorId)

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
        this.hypermerge.createDocument(keyPair)
        break
      }

      case "SetIdentity": {
//        const { identityUrl } = msg
//        this.hypermerge.setIdentity(identityUrl)
        break
      }
    }
  }
}

function add<T>(array: Array<T>, element: T) {
  array.includes(element) ? null : array.push(element)
}
