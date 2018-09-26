import { Doc, ChangeFn } from "automerge/frontend"
import * as Automerge from "automerge/frontend"
import * as Rx from "rxjs"
import Entry from "./StoreEntry"

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

(window as any).peek = () =>  { console.log("please use peek() on the backend console") }

export type Activity = UploadActivity | DownloadActivity

export default class Store {
  index: { [id: string]: Entry | undefined } = {}

  open(
    id: string,
    changeListener?: (doc: Doc<unknown>) => void,
  ): (cfn: ChangeFn<any>) => void {
    const existing = this.index[id]

    if (existing) {
      if (changeListener) {
        existing.listeners.push(changeListener)

        setImmediate(() => {
          // The caller may want to change on the first emit, so this must
          // be called async.
          if (existing.doc) changeListener(existing.doc)
        })
      }

      return existing.change
    }

    const entry = this.makeEntry(id)

    if (changeListener) entry.listeners.push(changeListener)

    return entry.change
  }

  create(setup: ChangeFn<any>): Promise<string> {
    const command = "Create"
    const args = {}

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, docId => {
        const entry = this.makeEntry(docId)
        entry.doc = Automerge.init(docId)
        entry.change(setup)
        resolve(docId)
      })
    })
  }

  makeEntry(id: string): Entry {
    const entry = new Entry(id)
    this.index[id] = entry
    return entry
  }

  activity(id: string): Rx.Observable<Activity> {
    return new Rx.Observable(obs => {
      const port = chrome.runtime.connect({ name: `${id}/activity` })
      port.onMessage.addListener(msg => obs.next(msg))
      port.onDisconnect.addListener(() => obs.complete())
    })
  }
}
