import * as WebSocket from "ws"
import * as Debug from "debug"
import { Duplex } from "stream"

const log = Debug("discovery-cloud:websocket")

export default class WebSocketStream extends Duplex {
  socket: WebSocket
  isOpen: boolean
  ready: Promise<this>

  constructor(url: string) {
    super()
    this.socket = new WebSocket(url)

    this.ready = new Promise(resolve => {
      this.socket.once("open", () => resolve(this))
    })

    this.socket
      .on("open", () => {
        this.emit("open", this)
        this.isOpen = true
      })
      .on("close", () => {
        this.end()
        this.isOpen = false
      })
      .on("error", err => {
        log("error", err)
      })
      .on("message", data => {
        log("socket.message", data)
        if (!this.push(data)) {
          log("stream closed, cannot write")
          this.socket.close()
        }
      })
  }

  _write(data: Buffer, _: unknown, cb: () => void) {
    log("_write", data)

    this.socket.send(data)
    cb()
  }

  _read() {}

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
