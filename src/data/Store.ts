import { Doc, ChangeFn } from "automerge/frontend"
import * as Automerge from "automerge/frontend"
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

export interface Entry {
  doc: Doc<unknown> | null
  listeners: Array<(doc: Doc<any>) => void>
  change: (changeFn: ChangeFn<any>) => void
  port: chrome.runtime.Port
}

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

    const entry = this.createEntry(id)

    if (changeListener) entry.listeners.push(changeListener)

    return entry.change
  }

  create(setup: ChangeFn<any>): Promise<string> {
    const command = "Create"
    const args = {}

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ command, args }, docId => {
        const entry = this.createEntry(docId)
        entry.doc = Automerge.init(docId)
        entry.change(setup)
        resolve(docId)
      })
    })
  }

  createEntry(id: string): Entry {
    // TODO: Entry should probably be it's own class and this would essentially
    // be the constructor.
    const port = chrome.runtime.connect({ name: `${id}/changes` })

    const change = (cfn: ChangeFn<unknown>) => {
      if (!entry.doc)
        throw new Error("Cannot call change before doc has loaded.")

      entry.doc = Automerge.change(entry.doc, cfn)

      const requests = Automerge.getRequests(entry.doc)
      port.postMessage(requests)
      entry.listeners.forEach(fn => fn(entry.doc))
    }

    const entry: Entry = (this.index[id] = {
      doc: null,
      listeners: [],
      change,
      port,
    })

    port.onMessage.addListener(({ actorId, patch }) => {
      if (!entry.doc) {
        entry.doc = Automerge.init(actorId)
      }

      entry.doc = Automerge.applyPatch(entry.doc, patch)

      entry.listeners.forEach(fn => fn(entry.doc))
    })

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
