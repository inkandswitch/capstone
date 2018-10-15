import { EventEmitter } from "events"
import { Patch, Doc, ChangeFn } from "automerge/frontend"
import * as Frontend from "automerge/frontend"
import Queue from "../../data/Queue"
import * as Debug from "debug"

const log = Debug("picomerge:front")

export type Patch = Patch

type Mode = "pending" | "read" | "write"

export class FrontendHandle<T> extends EventEmitter {
  docId: string
  actorId?: string
  changeQ: Queue<ChangeFn<T>> = new Queue()
  front: Doc<T>
  mode: Mode = "pending"
  back?: any // place to put the backend if need be - not needed here int he code so didnt want to import

  constructor(docId: string, actorId?: string) {
    super()

    if (actorId) {
      this.front = Frontend.init(actorId) as Doc<T>
      this.docId = docId
      this.actorId = actorId
      this.enableWrites()
    } else {
      this.front = Frontend.init({ deferActorId: true }) as Doc<T>
      this.docId = docId
    }
  }

  change = (fn: ChangeFn<T>) => {
    log("change")
    if (!this.actorId) {
      log("change needsActorId")
      this.emit("needsActorId")
    }
    this.changeQ.push(fn)
  }

  release = () => {
    this.removeAllListeners()
  }

  setActorId = (actorId: string) => {
    log("setActorId", actorId, this.mode)
    this.actorId = actorId
    this.front = Frontend.setActorId(this.front, actorId)

    if (this.mode === "read") this.enableWrites() // has to be after the queue
  }

  init = (actorId?: string, patch?: Patch) => {
    log("init actorId=", actorId, " patch=", !!patch)

    if (this.mode != "pending")
      throw new Error("init called when already ready")

    if (actorId) this.setActorId(actorId) // must set before patch

    if (patch) this.patch(patch) // first patch!

    this.mode = "read"

    if (actorId) this.enableWrites() // must enable after patch
  }

  private enableWrites() {
    this.mode = "write"
    this.changeQ.subscribe(fn => {
      const doc = Frontend.change(this.front, fn)
      const requests = Frontend.getRequests(doc)
      this.front = doc
      this.emit("doc", this.front)
      this.emit("requests", requests)
    })
  }

  patch = (patch: Patch) => {
    log("patch")
    this.front = Frontend.applyPatch(this.front, patch)
    this.emit("doc", this.front)
  }

  localPatch = (patch: Patch) => {
    log("local patch")
    this.front = Frontend.applyPatch(this.front, patch)
    this.emit("localdoc", this.front)
  }
}
