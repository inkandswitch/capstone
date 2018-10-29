import * as Debug from "debug"
import { BackendManager } from "../modules/hypermerge/backend"
import { Hypermerge } from "../modules/hypermerge"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"
import Queue from "./Queue"

const log = Debug("store:backend")

export default class StoreBackend {
  sendQueue = new Queue<Msg.BackendToFrontend>("StoreBackend")
  //presenceTick?: any
  hypermerge: Hypermerge
  docHandles: { [docId: string]: BackendManager } = {}
  //  workspaceQ: Queue<string> = new Queue()

  constructor(hm: Hypermerge) {
    log("constructing")
    this.hypermerge = hm
    ;(global as any).hm = this.hypermerge
    ;(global as any).sm = this
  }

  reset() {
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

        handle.on("actorId", actorId => {
          this.sendToFrontend({ type: "SetActorId", docId, actorId })
        })

        handle.on("ready", (actorId, patch) => {
          this.sendToFrontend({ type: "DocReady", docId, actorId, patch })
        })

        handle.on("patch", patch => {
          this.sendToFrontend({ type: "ApplyPatch", docId, patch })
        })

        const docInfo = () => {
          const peers = handle.peers().length
          const feeds = handle.feeds().length
          log("DOC INFO", peers, feeds)
          this.sendToFrontend({ type: "DocInfo", docId, peers, feeds })
        }

        handle.on("peer-add", docInfo)
        handle.on("peer-remove", docInfo)
        handle.on("feed", docInfo)
        docInfo()

        break
      }

      case "ChangeRequest": {
        const { docId, change } = msg
        const handle = this.docHandles[docId]
        handle.applyLocalChange(change)
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
    }
  }
}

function add<T>(array: Array<T>, element: T) {
  array.includes(element) ? null : array.push(element)
}
