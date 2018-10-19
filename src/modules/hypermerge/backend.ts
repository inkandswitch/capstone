import { EventEmitter } from "events"
import * as Backend from "automerge/backend"
import { Change, Patch, BackDoc } from "automerge/backend"
import { Peer } from "./hypercore"
import Queue from "../../data/Queue"
import { EXT, Hypermerge } from "."
import * as Debug from "debug"

const log = Debug("hypermerge:back")

export class BackendHandle extends EventEmitter {
  hypermerge: Hypermerge
  docId: string
  back?: BackDoc
  actorId?: string
  backQ: Queue<() => void> = new Queue("backQ")
  wantsActor: boolean = false

  constructor(core: Hypermerge, docId: string, back?: BackDoc) {
    super()

    this.hypermerge = core
    this.docId = docId

    if (back) {
      this.back = back
      this.actorId = docId
      this.backQ.subscribe(f => f())
      this.emit("ready", docId, undefined)
    }

    this.on("newListener", (event, listener) => {
      if (event === "patch" && this.back) {
        const patch = Backend.getPatch(this.back)
        listener(patch)
      }
    })
  }

  applyRemoteChanges = (changes: Change[]): void => {
    this.backQ.push(() => {
      let [back, patch] = Backend.applyChanges(this.back!, changes)
      this.back = back
      this.emit("patch", patch)
    })
  }

  applyLocalChanges = (changes: Change[]): void => {
    this.backQ.push(() => {
      changes.forEach(change => {
        let [back, patch] = Backend.applyLocalChange(this.back!, change)
        this.back = back
        this.emit("localpatch", patch)
        this.hypermerge.writeChange(this, this.actorId!, change)
      })
    })
  }

  actorIds = (): string[] => {
    return this.hypermerge.docMetadata.get(this.docId) || []
  }

  release = () => {
    this.removeAllListeners()
    this.hypermerge.releaseHandle(this)
  }

  initActor = () => {
    log("initActor")
    if (this.back) {
      // if we're all setup and dont have an actor - request one
      if (!this.actorId) {
        log("get actorId now")
        this.actorId = this.hypermerge.initActorFeed(this)
        this.emit("actorId", this.actorId)
      }
    } else {
      // remember we want one for when init happens
      log("get actorId later")
      this.wantsActor = true
    }
  }

  init = (changes: Change[], actorId?: string) => {
    const [back, patch] = Backend.applyChanges(Backend.init(), changes)
    this.actorId = actorId
    if (this.wantsActor && !actorId) {
      this.actorId = this.hypermerge.initActorFeed(this)
    }
    this.back = back
    this.backQ.subscribe(f => f())
    this.emit("ready", this.actorId, patch)
  }

  broadcast(message: any) {
    log("boardcast", message)
    this.hypermerge.peers(this).forEach(peer => this.message(peer, message))
  }

  message(peer: Peer, message: any) {
    peer.stream.extension(EXT, Buffer.from(JSON.stringify(message)))
  }

  messageMetadata(peer: Peer) {
    this.message(peer, this.metadata())
  }

  broadcastMetadata() {
    this.broadcast(this.actorIds())
  }

  metadata(): string[] {
    return this.actorIds()
  }

  /*
  message(message) {
    if (this.hypermerge.readyIndex[this.docId]) {
      this.hypermerge.message(this.docId, message)
    }
  }

  connections() {
    let peers = this.actorIds().map(
      actorId => this.hypermerge._trackedFeed(actorId).peers,
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
