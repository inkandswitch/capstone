import { EventEmitter } from "events"
import { Patch, Doc, ChangeFn } from "automerge/frontend"
import * as Frontend from "automerge/frontend"
import Queue from "../../data/Queue"
import * as Debug from "debug"

const log = Debug("picomerge:back")

export type Patch = Patch;

type Mode = "r" | "w"

export class FrontendHandle<T> extends EventEmitter {
  docId: string
  mode: Mode
  actorId?: string
  changeQ: Queue<ChangeFn<T>> = new Queue()
  front: Doc<T>

  constructor(docId: string, mode: Mode) {
    super()

    this.front = Frontend.init({ deferActorId: true }) as Doc<T>
    this.docId = docId
    this.mode = mode
  }

  change = (fn: ChangeFn<T>) => {
    if (this.mode === "r") throw new Error("write error on doc " + this.docId)
    this.changeQ.push(fn)
  }

  release() {
    this.removeAllListeners()
  }

  init = (actorId?: string, patch?: Patch) => {
    this.actorId = actorId

    if (actorId) {
      this.front = Frontend.setActorId(this.front, actorId)
    }

    if (patch) {
      this.front = Frontend.applyPatch(this.front, patch)
    }

    this.changeQ.subscribe(fn => {
      const doc = Frontend.change(this.front, fn)
      const requests = Frontend.getRequests(doc)
      this.front = doc
      this.emit("doc", this.front)
      this.emit("requests", requests)
    })
  }

  patch = (patch: Patch) => {
    log("PATCH")
    this.front = Frontend.applyPatch(this.front, patch)
    this.emit("doc", this.front)
  }

  localPatch = (patch: Patch) => {
    log("LOCAL PATCH")
    this.front = Frontend.applyPatch(this.front, patch)
    this.emit("localdoc", this.front)
  }
}
