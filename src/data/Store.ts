import { Doc, ChangeFn } from "automerge/frontend"
import * as Automerge from "automerge/frontend"
import * as Rx from "rxjs"
import { keyPair } from "hypercore/lib/crypto"
import * as Base58 from "bs58"
import { FrontendHandle } from "../modules/hypermerge/frontend"

function isId(id: string) {
  return id.length >= 32 && id.length <= 44
}

type CommandMessage = "Create" | "Open" | "Replace"

interface UploadActivity {
  type: "Upload"
  actorId: string
  seq: number
}

interface DownloadActivity {
  type: "Download"
  actorId: string
  seq: number
}

;(window as any).peek = () => {
  console.log("please use peek() on the backend console")
}

export type Activity = UploadActivity | DownloadActivity

export default class Store {
  index: { [id: string]: FrontendHandle } = {}
  presenceSubject: Rx.BehaviorSubject<any>

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

  makeHandle(id: string): FrontendHandle {
    let port = chrome.runtime.connect({ name: `${id}/changes` })
    let handle = new FrontendHandle(id)

    port.onMessage.addListener(({ actorId, patch }) => {
      handle.setActorId(actorId)
      handle.patch(patch)
    })

    handle.on("requests", requests => {
      port.postMessage(requests)
    })

    port.onDisconnect.addListener(() => {
      console.log("Port disconnect handle", id)
      handle.release()
      delete this.index[id]
    })

    this.index[id] = handle

    return handle
  }

  clipper(): Rx.Observable<any> {
    return new Rx.Observable(obs => {
      const port = chrome.runtime.connect({ name: "clipper" })
      port.onMessage.addListener(msg => obs.next(msg))
      port.onDisconnect.addListener(() => obs.complete())
    })
  }

  activity(id: string): Rx.Observable<Activity> {
    return new Rx.Observable(obs => {
      const port = chrome.runtime.connect({ name: `${id}/activity` })
      port.onMessage.addListener(msg => obs.next(msg))
      port.onDisconnect.addListener(() => obs.complete())
    })
  }

  presence(): Rx.BehaviorSubject<any> {
    if (!this.presenceSubject) {
      this.presenceSubject = new Rx.BehaviorSubject(null)
      const port = chrome.runtime.connect({ name: `*/presence` })
      port.onMessage.addListener(msg => this.presenceSubject.next(msg))
      port.onDisconnect.addListener(() => this.presenceSubject.complete())
    }
    return this.presenceSubject
  }
}
