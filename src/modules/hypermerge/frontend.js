const EventEmitter = require("events")
const Frontend = require("automerge/frontend")

export class FrontendHandle extends EventEmitter {
  constructor(docId) {
    super()

    this.docId = docId

    this.pFront = new Promise((resolve,reject) => {
      this.on("ready", resolve)
    })

    this.on('newListener', (event, listener) => {
      if (event === 'doc' && this._front) {
        listener(this._front)
      }
    });

    this.change = this._change.bind(this)
  }

  _change(fn) {
    this.pFront.then(() => {
      this._front = Frontend.change(this._front, fn)
      this.emit("doc",this._front)
      this.emit("requests", Frontend.getRequests(this._front))
    })
  }

  release() {
    this.removeAllListeners()
  }

  setActorId(actorId) {
    if (!this._front) {
      this._front = Frontend.init(actorId)
      this.emit("ready")
    }
  }

  patch(patch) {
    this.pFront.then(() => {
      this._front = Frontend.applyPatch(this._front, patch)
      this.emit("doc",this._front)
    })
  }
}
