const EventEmitter = require("events")
const Backend = require("automerge/backend")
const Frontend = require("automerge/frontend")

export class BackendHandle {
  constructor(hm, docId, doc) {
    this.hm = hm
    this.docId = docId
    this.actorId = doc ? doc.get("actorId") : null
    this._back = doc || null
    this._onpatch = () => {}
    this._pending_back = []
  }

  // for debugging
  toFrontend() {
    return Frontend.applyPatch(Frontend.init("_"), Backend.getPatch(this._back))
  }

  // for debugging
  toString(spaces = 2) {
    return JSON.stringify(this.toFrontend(), undefined, 2)
  }

  applyChanges(changes) {
    if (this._back) {
      this.hm.applyChanges(this.docId, changes, true)
    } else {
      this._pending_back.push(changes)
    }
  }

  onPatch(cb) {
    this._onpatch = cb
    if (this._back) {
      cb(this._uberPatch())
    }
  }

  actorIds() {
    return this.hm.docIndex[this.docId] || []
  }

  release() {
    this.hm.releaseHandle(this)
  }

  // internals

  _uberPatch() {
    // memoize for speed?
    return Backend.getPatch(this._back)
  }

  _update(back, patch) {
    this._back = back
    this._onpatch(patch)
  }

  _ready(back) {
    this._back = back
    this.actorId = back.get("actorId")

    this._onpatch(this._uberPatch())

    this._pending_back.map(changes => this.applyChanges(changes))
    this._pending_back = []
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

