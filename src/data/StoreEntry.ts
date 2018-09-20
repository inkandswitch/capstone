import { Doc, ChangeFn } from "automerge/frontend"
import * as Automerge from "automerge/frontend"

export default class Entry {
  doc: Doc<unknown> | null = null
  listeners: Array<(doc: Doc<any>) => void> = []
  port: chrome.runtime.Port

  constructor(id: string) {
    this.port = chrome.runtime.connect({ name: `${id}/changes` })
    this.port.onMessage.addListener(this._onMessage)
  }

  change = (cfn: ChangeFn<unknown>) => {
    if (!this.doc) throw new Error("Cannot call change before doc has loaded.")

    this.doc = Automerge.change(this.doc, cfn)

    const requests = Automerge.getRequests(this.doc)
    this.port.postMessage(requests)
    this.listeners.forEach(fn => fn(this.doc))
  }

  _onMessage = ({ actorId, patch }: any) => {
    if (!this.doc) {
      this.doc = Automerge.init(actorId)
    }

    this.doc = Automerge.applyPatch(this.doc, patch)

    this.listeners.forEach(fn => fn(this.doc))
  }
}
