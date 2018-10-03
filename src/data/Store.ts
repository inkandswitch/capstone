import { Doc, ChangeFn } from "automerge/frontend"
import * as Automerge from "automerge/frontend"
import * as Rx from "rxjs"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import * as Msg from "./StoreMsg"
import { FrontendHandle } from "../modules/hypermerge/frontend"

function isId(id: string) {
  return id.length >= 32 && id.length <= 44
}

;(window as any).peek = () => {
  console.log("please use peek() on the backend console")
}

export type Activity = Msg.UploadActivity | Msg.DownloadActivity

export default class Store {
  _send: (msg: Msg.FrontendToBackend) => void
  index: { [id: string]: FrontendHandle } = {}
  presence$: Rx.BehaviorSubject<Msg.Presence | null>

  constructor(send: (msg: Msg.FrontendToBackend) => void) {
    this._send = send
    this.presence$ = new Rx.BehaviorSubject(null)
  }

  handle(id: string): FrontendHandle {
    return this.index[id] || this.makeHandle(id)
  }

  create(setup: ChangeFn<any>): string {
    const command = "Create"

    const buffers = keyPair()
    const keys = {
      publicKey: Base58.encode(buffers.publicKey),
      secretKey: Base58.encode(buffers.secretKey),
    }
    const args = { keys }
    const docId = keys.publicKey

    chrome.runtime.sendMessage({ command, args })
    const handle = this.makeHandle(docId)
    handle.setActorId(docId)
    handle.change(setup)
    return docId
  }

  setIdentity(identityUrl: string) {
    const command = "SetIdentity"
    const args = { identityUrl }
    chrome.runtime.sendMessage({ command, args })
  }

  makeHandle(docId: string): FrontendHandle {
    const handle = new FrontendHandle(docId)

    handle.on("requests", requests => {
      this.sendToBackend(requests)
    })

    this.sendToBackend({ type: "Open", docId })

    // TODO:
    // port.onDisconnect.addListener(() => {
    //   console.log("Port disconnect handle", docId)
    //   handle.release()
    //   delete this.index[docId]
    // })

    this.index[docId] = handle

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

  sendToBackend = (msg: Msg.FrontendToBackend) => {
    this._send(msg)
  }

  onMessage(msg: Msg.BackendToFrontend) {
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
