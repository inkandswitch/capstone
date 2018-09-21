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

let DOCS: { [k: string]: Doc<any> } = {}
let RECEIVE: { [k: string]: ((doc: Doc<any>) => void)[] } = {}
let CHANGE: { [k: string]: ((cfn: ChangeFn<any>) => void) } = {}

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

  open(
    id: string,
    receiveChangeCallback: (doc: Doc<any>) => void,
  ): (cfn: ChangeFn<any>) => void {
    RECEIVE[id] = (RECEIVE[id] || []).concat([receiveChangeCallback])

    if (DOCS[id]) setTimeout(() => receiveChangeCallback(DOCS[id]), 50) /// UGHHHH!! :'(

    if (CHANGE[id]) return CHANGE[id]

    var port = chrome.runtime.connect({ name: `${id}/changes` })
    port.onMessage.addListener(({ actorId, patch }) => {
      if (DOCS[id] === undefined) {
        DOCS[id] = init(actorId)
      }

      DOCS[id] = applyPatch(DOCS[id], patch)

      RECEIVE[id].map(fn => fn(DOCS[id]))
    })
    const sendChangeFn = (cfn: ChangeFn<any>) => {
      DOCS[id] = change(DOCS[id], cfn)
      let requests = getRequests(DOCS[id])
      port.postMessage(requests)
      RECEIVE[id].map(fn => fn(DOCS[id]))
    }

    CHANGE[id] = sendChangeFn

    return sendChangeFn
  }

  create(setup: ChangeFn<any>): Promise<string> {
    const command = "Create"
    const args = {}

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, docId => {
        DOCS[docId] = init(docId)
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
