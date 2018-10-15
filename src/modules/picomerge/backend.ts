import { EventEmitter } from "events"
import * as Backend from 'automerge/backend'
import { Change, Patch, BackDoc } from 'automerge/backend'
import Queue from "../../data/Queue"
import { Picomerge } from "."
import * as Debug from "debug"

const log = Debug("picomerge:back")

interface BackWrapper {
  back: BackDoc
}

export class BackendHandle extends EventEmitter {
  core: Picomerge
  docId: string
  back?: BackWrapper
  actorId?: string
  backQ: Queue<(handle:BackWrapper) => void> = new Queue()

  constructor(core: Picomerge, docId: string, back?: BackDoc) {
    super()

    this.core = core
    this.docId = docId

    if (back) {
      const handle = { back }
      this.back = handle
      this.actorId = docId
      this.backQ.subscribe(f => f(handle))
      this.emit("ready", docId, undefined)
    }

    this.on("newListener", (event, listener) => {
      if (event === "patch" && this.back) {
        const patch = Backend.getPatch(this.back.back)
        listener(patch)
      }
    })
  }

  applyRemoteChanges = (changes: Change[]) : void => {
    this.backQ.push((handle) => {
      let [ back, patch ] = Backend.applyChanges(handle.back, changes)
      handle.back = back
      this.emit("patch", patch)
    })
  }

  applyLocalChanges = (changes: Change[]) : void => {
    this.backQ.push((handle) => {
      changes.forEach(change => {
        let [ back, patch ] = Backend.applyLocalChange(handle.back, change)
        handle.back = back
        this.emit("localpatch", patch)
        this.core.writeChange(this, this.actorId!, change)
      })
    })
  }

  actorIds() : string[] {
    return this.core.docMetadata.get(this.docId) || []
  }

  release() {
    this.removeAllListeners()
    this.core.releaseHandle(this)
  }

  init(changes: Change[], actorId?: string) {
    const [back, patch] = Backend.applyChanges(Backend.init(), changes)
    const handle = { back }
    this.actorId = actorId
    this.back = handle
    this.backQ.subscribe(f => f(handle))
    this.emit("ready", actorId, patch)
  }

/*
  message(message) {
    if (this.core.readyIndex[this.docId]) {
      this.core.message(this.docId, message)
    }
  }

  connections() {
    let peers = this.actorIds().map(
      actorId => this.core._trackedFeed(actorId).peers,
    )
    return peers.reduce((acc, val) => acc.concat(val), [])
  }

  peers() {
    return this.connections().filter(peer => !!peer.identity)
  }

  onMessage(cb) {
    this._messageCb = cb
    return this
  }

  _message({ peer, msg }) {
    if (this._messageCb) {
      this._messageCb({ peer, msg })
    }
  }
*/
}
