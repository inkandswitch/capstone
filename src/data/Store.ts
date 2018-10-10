import { Doc, ChangeFn } from "automerge/frontend"
import * as Debug from "debug"
import * as Rx from "rxjs"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"
import { FrontendHandle } from "../modules/hypermerge/frontend"
import Queue from "./Queue"

const log = Debug("store:frontend")

function isId(id: string) {
  return id.length >= 32 && id.length <= 44
}

;(window as any).peek = () => {
  console.log("please use peek() on the backend console")
}

export type Activity = Msg.UploadActivity | Msg.DownloadActivity

export default class Store {
  queue = new Queue<Msg.FrontendToBackend>()
  index: { [id: string]: FrontendHandle } = {}
  presence$: Rx.BehaviorSubject<Msg.Presence | null>

  constructor() {
    log("constructing")

    this.presence$ = new Rx.BehaviorSubject<Msg.Presence | null>(null)
  }

  handle(id: string): FrontendHandle {
    return this.index[id] || this.makeHandle(id)
  }

  create(setup: ChangeFn<any>): string {
    const buffers = keyPair()
    const keys = {
      publicKey: Base58.encode(buffers.publicKey),
      secretKey: Base58.encode(buffers.secretKey),
    }

    const docId = keys.publicKey

    this.sendToBackend({
      type: "Create",
      docId,
      keys,
    })

    const handle = this.makeHandle(docId)
    handle.setActorId(docId)
    handle.change(setup)
    return docId
  }

  setIdentity(identityUrl: string) {
    this.sendToBackend({
      type: "SetIdentity",
      identityUrl,
    })
  }

  makeHandle(docId: string): FrontendHandle {
    const handle = new FrontendHandle(docId)

    this.index[docId] = handle

    handle.on("requests", changes => {
      this.sendToBackend({
        type: "ChangeRequest",
        docId,
        changes,
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
    this.queue.push(msg)
  }

  onMessage(msg: Msg.BackendToFrontend) {
    log("frontend <- backend", msg)
    switch (msg.type) {
      case "Patch": {
        const handle = this.handle(msg.docId)
        handle.setActorId(msg.actorId)
        handle.patch(msg.patch)
        break
      }

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
