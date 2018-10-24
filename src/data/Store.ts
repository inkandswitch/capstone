import { Doc, ChangeFn } from "automerge/frontend"
import * as Debug from "debug"
import * as Rx from "rxjs"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"
import { FrontendHandle } from "../modules/hypermerge/frontend"
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
  index: { [id: string]: FrontendHandle<any> } = {}
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

  handle(id: string): FrontendHandle<any> {
    return this.index[id] || this.makeHandle(id)
  }

  create(setup: ChangeFn<any>): FrontendHandle<any> {
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

    const handle = this.makeHandle(docId, docId)
    handle.change(setup)
    return handle
  }

  setIdentity(identityUrl: string) {
    this.sendToBackend({
      type: "SetIdentity",
      identityUrl,
    })
  }

  makeHandle(docId: string, actorId?: string): FrontendHandle<any> {
    log("makeHandle", docId, actorId)
    const handle = new FrontendHandle<any>(docId, actorId)

    this.index[docId] = handle

    //    handle.on("doc", (doc) => {
    //      log("DOC", doc)
    //    })

    handle.on("needsActorId", () => {
      log("needsActorId", docId)
      this.sendToBackend({
        type: "ActorIdRequest",
        docId,
      })
    })

    handle.on("request", change => {
      this.sendToBackend({
        type: "ChangeRequest",
        docId,
        change,
      })
    })

    this.sendToBackend({ type: "Open", docId })

    // TODO:
    // port.onDisconnect.addListener(() => {
    //   console.log("Port disconnect handle", docId)
    //   handle.release()
    //   delete this.index[docId]
    // })

    return handle
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
        const handle = this.handle(msg.docId)
        handle.init(msg.actorId, msg.patch)
        break
      }
      case "DocInfo": {
        log("DocInfo", msg.docId, msg.peers, msg.feeds)
        const handle = this.handle(msg.docId)
        this.peerCount[msg.docId] = msg.peers
        this.feedCount[msg.docId] = msg.feeds
        handle.emit("info", msg.peers, msg.feeds)
        break
      }
      case "ApplyPatch": {
        log("ApplyPatch", msg.docId)
        const handle = this.handle(msg.docId)
        handle.patch(msg.patch)
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
