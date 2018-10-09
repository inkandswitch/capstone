import * as Debug from "debug"
import { Duplex } from "stream"
import WebSocket from "./WebSocket"

const crypto = require('crypto')

const log = Debug("discovery-cloud:WebSocketStream")

export default class WebSocketStream extends Duplex {
  socket: WebSocket
  ready: Promise<this>
  tag: string

  constructor(url: string) {
    super()
    this.tag = crypto.randomBytes(2).toString('hex')
    this.socket = new WebSocket(url)
    this.socket.binaryType = "arraybuffer"

    this.ready = new Promise(resolve => {
      this.socket.addEventListener("open", () => {
        log("socket.open(2)", this.tag)
        resolve(this)
      })
    })

    this.socket.addEventListener("open", () => {
      log("socket.open", this.tag)
      this.emit("open", this)
    })

    this.socket.addEventListener("close", () => {
      log("socket.close", this.tag)
      this.destroy() // TODO is this right?
    })

    this.socket.addEventListener("error", err => {
      log("socket.error", this.tag, err)
      this.emit("error", err)
    })

    this.socket.addEventListener("message", event => {
      const data = Buffer.from(event.data)
      log("socket.message", this.tag, data)

      if (!this.push(data)) {
        log("stream closed, cannot write", this.tag)
        this.socket.close()
      }
    })
  }

  get isOpen() {
    return this.socket.readyState === WebSocket.OPEN
  }

  _write(data: Buffer, _: unknown, cb: () => void) {
    log("_write", data)

    this.socket.send(data)
    cb()
  }

  _read() {
    // Reading is done async
  }

  _destroy(err: Error | null, cb: (error: Error | null) => void) {
    log("_destroy", err)

    if (err) {
      // this.socket.emit("error", err)
      // this.socket.terminate()
      cb(null)
    }
  }

  _final(cb: (error?: Error | null | undefined) => void) {
    log("_final", cb)
    this.socket.close()
    cb()
  }
}
