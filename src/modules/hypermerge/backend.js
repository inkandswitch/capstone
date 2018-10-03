const EventEmitter = require("events")
const Backend = require("automerge/backend")
const Frontend = require("automerge/frontend")

export class BackendHandle extends EventEmitter {
  constructor(hm, docId, doc) {
    super()

    this.hm = hm
    this.docId = docId
    this._back = doc || null

    this.pBack = new Promise((resolve,reject) => this.on("ready", resolve))

    if (this._back) this.emit("ready",this._back)

    this.on('newListener', (event, listener) => {
      if (event === 'patch' && this._back) {
        const patch = Backend.getPatch(this._back)
        listener(patch)
      }
    });
  }

  // for debugging
  toFrontend() {
    const front = Frontend.init("_")
    return this._back ? Frontend.applyPatch(front, Backend.getPatch(this._back)) : front
  }

  // for debugging
  toString(spaces = 2) {
    return JSON.stringify(this.toFrontend(), undefined, 2)
  }

  applyChanges(changes) {
    this.pBack.then(back => this.hm.applyChanges(this.docId, changes, true))
  }

  actorIds() {
    return this.hm.docIndex[this.docId] || []
  }

  release() {
    this.removeAllListeners()
    this.hm.releaseHandle(this)
  }

  _update(back, patch) {
    this._back = back
    this.emit("patch",patch)
  }

  _ready(back) {
    this._back = back
    const patch = Backend.getPatch(this._back)

    this.emit("ready",back)
    this.emit("patch",patch)
  }

  // message stuff

  message(message) {
    if (this.hm.readyIndex[this.docId]) {
      this.hm.message(this.docId, message)
    }
  }

  connections() {
    let peers = this.actorIds().map(actorId => this.hm._trackedFeed(actorId).peers)
    return peers.reduce((acc,val) => acc.concat(val),[])
  }

  peers() {
    return this.connections().filter( peer => !!peer.identity)
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
}

