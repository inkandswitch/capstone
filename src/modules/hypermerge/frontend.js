const EventEmitter = require("events")
const Frontend = require("automerge/frontend")

class FrontendHandle {
  constructor(hm, docId, doc) {
    this.hm = hm
    this.docId = docId
    this.actorId = doc ? doc.get("actorId") : null
    this._back = doc || null
    this._front = null
    this._isManagingFront = false
    this._ondoc = () => {}
    this._onpatch = () => {}
    this._pending_front = []
    this._pending_back = []
  }

  applyChanges(changes) {
    if (this._back) {
      this.hm.applyChanges(this.docId, changes, true)
    } else {
      this._pending_back.push(changes)
    }
  }

  actorIds() {
    return this.hm.docIndex[this.docId] || []
  }

  toString(spaces = null) {
    if (this._back) {
      return JSON.stringify(this._front ||  Frontend.applyPatch(Frontend.init("_"), Backend.getPatch(this._back)), undefined, spaces)
    } else {
      return 'null'
    }
  }

  onPatch(cb) {
    this._onpatch = cb
    if (this._back) {
      cb(this._uberPatch())
    }
  }

  onChange(cb) {
    this._ondoc = cb
    this._isManagingFront = true
    this._setupFront()
  }

  change(fn) {
    this._isManagingFront = true
    this._setupFront()
    if (this._front) {
      this._applyFN(fn)
    } else {
      this._pending_front.push(fn)
    }
  }

  release() {
    this.hm.releaseHandle(this)
  }

  _setupFront() {
    if (this._back && !this._front && this._isManagingFront) {
      this._front = Frontend.init(this.actorId)
      this._applyPatch(this._uberPatch())
      this._pending_front.forEach(fn => this._applyFN(fn))
      this._pending_front = []
    }
  }

  // internals

  _applyFN(fn) {
    this._front = Frontend.change(this._front, fn)
    this.applyChanges(Frontend.getRequests(this._front))
    return this._front
  }

  _uberPatch() {
    // memoize for speed?
    return Backend.getPatch(this._back)
  }

  _applyPatch(patch) {
    if (this._front && patch.diffs.length > 0) {
      this._front = Frontend.applyPatch(this._front, patch)
      this._ondoc(this._front)
    }
  }

  _update(back, patch) {
    this._back = back
    this._onpatch(patch)
    this._applyPatch(patch)
  }

  _ready(back) {
    this._back = back
    this._front = null
    this.actorId = back.get("actorId")

    this._onpatch(this._uberPatch())

    this._setupFront()

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
