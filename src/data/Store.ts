import {
  change,
  init,
  getRequests,
  applyPatch,
  Doc,
  ChangeFn,
} from "automerge/frontend"
import * as Rx from "rxjs"

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

export type Activity = UploadActivity | DownloadActivity

export default class Store {
  docs: { [id: string]: Doc<any> } = {}
  listeners: { [id: string]: ((doc: Doc<any>) => void)[] } = {}
  changeFns: { [id: string]: (changeFn: ChangeFn<any>) => void } = {}

  open(
    id: string,
    changeListener: (doc: Doc<any>) => void,
  ): (cfn: ChangeFn<any>) => void {
    this.listeners[id] = (this.listeners[id] || []).concat([changeListener])

    if (this.docs[id]) setTimeout(() => changeListener(this.docs[id]), 50) /// UGHHHH!! :'(

    if (this.changeFns[id]) return this.changeFns[id]

    const port = chrome.runtime.connect({ name: `${id}/changes` })
    port.onMessage.addListener(({ actorId, patch }) => {
      if (!this.docs[id]) {
        this.docs[id] = init(actorId)
      }

      this.docs[id] = applyPatch(this.docs[id], patch)

      this.listeners[id].forEach(fn => fn(this.docs[id]))
    })

    const sendChangeFn = (cfn: ChangeFn<any>) => {
      this.docs[id] = change(this.docs[id], cfn)
      const requests = getRequests(this.docs[id])
      port.postMessage(requests)
      this.listeners[id].map(fn => fn(this.docs[id]))
    }

    this.changeFns[id] = sendChangeFn

    return sendChangeFn
  }

  create(setup: ChangeFn<any>): Promise<string> {
    const command = "Create"
    const args = {}

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, docId => {
        this.docs[docId] = init(docId)
        resolve(docId)
        const changeFn = this.open(docId, doc => {})
        changeFn(setup)
      })
    })
  }

  activity(id: string): Rx.Observable<Activity> {
    return new Rx.Observable(obs => {
      const port = chrome.runtime.connect({ name: `${id}/activity` })
      port.onMessage.addListener(msg => obs.next(msg))
      port.onDisconnect.addListener(() => obs.complete())
    })
  }
}
