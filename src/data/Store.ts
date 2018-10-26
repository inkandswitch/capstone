import { Doc, ChangeFn } from "automerge/frontend"
import * as Debug from "debug"
import * as Rx from "rxjs"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"
import { FrontendManager } from "../modules/hypermerge/frontend"
import Queue from "./Queue"

const log = Debug("store:front")

function isId(id: string) {
  return id.length >= 32 && id.length <= 44
}

;(window as any).peek = () => {
  console.log("please use peek() on the backend console")
}

export type Activity = Msg.UploadActivity | Msg.DownloadActivity

export default class Store {
  sendQueue = new Queue<Msg.FrontendToBackend>("Store")
  index: { [id: string]: FrontendManager<any> } = {}
  peerCount: { [id: string]: number } = {}
  feedCount: { [id: string]: number } = {}
  presence$: Rx.BehaviorSubject<Msg.Presence | null>
  clipper$: Rx.BehaviorSubject<Msg.Clipper | null>
  control$: Rx.BehaviorSubject<Msg.Control | null>

  constructor() {
    log("constructing")

    this.presence$ = new Rx.BehaviorSubject<Msg.Presence | null>(null)
    this.clipper$ = new Rx.BehaviorSubject<Msg.Clipper | null>(null)
    this.control$ = new Rx.BehaviorSubject<Msg.Control | null>({
      type: "Control",
      url: this.getWorkspace(),
    })
  }

  create(setup: ChangeFn<any>): FrontendManager<any> {
    const buffers = keyPair()
    const keys = {
      publicKey: Base58.encode(buffers.publicKey),
      secretKey: Base58.encode(buffers.secretKey),
    }

    const docId = keys.publicKey

    log("create", docId)
    this.sendToBackend({
      type: "Create",
      docId,
      keys,
    })

    const manager = this.manager(docId, docId)
    manager.change(setup)
    return manager
  }

  setIdentity(identityUrl: string) {
    this.sendToBackend({
      type: "SetIdentity",
      identityUrl,
    })
  }

  manager(docId: string, actorId?: string): FrontendManager<any> {
    if (this.index[docId]) return this.index[docId]

    log("manager", docId, actorId)
    const manager = new FrontendManager<any>(docId, actorId)

    this.index[docId] = manager

    //    manager.on("doc", (doc) => {
    //      log("DOC", doc)
    //    })

    manager.on("needsActorId", () => {
      log("needsActorId", docId)
      this.sendToBackend({
        type: "ActorIdRequest",
        docId,
      })
    })

    manager.on("request", change => {
      this.sendToBackend({
        type: "ChangeRequest",
        docId,
        change,
      })
    })

    this.sendToBackend({ type: "Open", docId })

    // TODO:
    // port.onDisconnect.addListener(() => {
    //   console.log("Port disconnect manager", docId)
    //   manager.release()
    //   delete this.index[docId]
    // })

    return manager
  }

  clipper(): Rx.Observable<Msg.Clipper | null> {
    return this.clipper$
  }

  control(): Rx.Observable<Msg.Control | null> {
    return this.control$
  }

  getWorkspace(): string | null {
    return localStorage.workspaceUrl || null
  }

  setWorkspace(url: string | null) {
    url ? (localStorage.workspaceUrl = url) : delete localStorage.workspaceUrl
    this.control$.next({ type: "Control", url })
  }

  activity(id: string): Rx.Observable<Activity> {
    return new Rx.Observable(obs => {
      // TODO:
      // const port = chrome.runtime.connect({ name: `${id}/activity` })
      // port.onMessage.addListener(msg => obs.next(msg))
      // port.onDisconnect.addListener(() => obs.complete())
    })
  }

  presence(): Rx.Observable<Msg.Presence | null> {
    return this.presence$
  }

  sendToBackend(msg: Msg.FrontendToBackend) {
    this.sendQueue.push(msg)
  }

  onMessage(msg: Msg.BackendToFrontend) {
    switch (msg.type) {
      case "DocReady": {
        log("DocReady", msg.docId)
        const manager = this.manager(msg.docId)
        manager.init(msg.actorId, msg.patch)
        break
      }
      case "DocInfo": {
        log("DocInfo", msg.docId, msg.peers, msg.feeds)
        const manager = this.manager(msg.docId)
        this.peerCount[msg.docId] = msg.peers
        this.feedCount[msg.docId] = msg.feeds
        manager.emit("info", msg.peers, msg.feeds)
        break
      }
      case "ApplyPatch": {
        log("ApplyPatch", msg.docId)
        const manager = this.manager(msg.docId)
        manager.patch(msg.patch)
        break
      }

      case "SetActorId": {
        const manager = this.manager(msg.docId)
        manager.setActorId(msg.actorId)
        break
      }

      case "Clipper":
        this.clipper$.next(msg)
        break

      case "Presence":
        this.presence$.next(msg)
        break

      case "Upload":
        break

      case "Download":
        break
    }
  }
}
