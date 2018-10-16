import { EventEmitter } from "events"
import { Patch, Doc, ChangeFn } from "automerge/frontend"
import * as Frontend from "automerge/frontend"
import Queue from "../../data/Queue"
import * as Debug from "debug"
import { age } from "../utils"

const log = Debug("hypermerge:front")

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

    this.on("newListener", (event, listener) => {
      if (event === "doc" && this.mode != "pending") {
        listener(this.front)
      }
    })
  }

  change = (fn: ChangeFn<T>) => {
    if (!this.actorId) {
      this.emit("needsActorId")
    }
    this.changeQ.push(fn)
  }

  release = () => {
    this.removeAllListeners()
  }

  setActorId = (actorId: string) => {
    this.actorId = actorId
    this.front = Frontend.setActorId(this.front, actorId)

    if (this.mode === "read") this.enableWrites() // has to be after the queue
  }

  init = (actorId?: string, patch?: Patch) => {
    log(`init docid=${this.docId} actorId=${actorId} patch=${!!patch} mode=${this.mode}`, age())

    if (this.mode !== "pending") return

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
    this.front = Frontend.applyPatch(this.front, patch)
    if (patch.diffs.length > 0) {
      this.emit("doc", this.front)
    }
  }

  localPatch = (patch: Patch) => {
    this.front = Frontend.applyPatch(this.front, patch)
    if (patch.diffs.length > 0) {
      this.emit("localdoc", this.front)
    }
  }
}