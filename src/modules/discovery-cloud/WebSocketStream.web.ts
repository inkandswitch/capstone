import * as Debug from "debug"
import { Duplex } from "stream"

const log = Debug("discovery-cloud:websocket-web")

export default class WebSocketStream extends Duplex {
  socket: WebSocket
  isOpen: boolean
  ready: Promise<this>

  constructor(url: string) {
    super()
    this.socket = new WebSocket(url)
    this.socket.binaryType = "arraybuffer"

    this.ready = new Promise(resolve => {
      const onOpen = () => {
        resolve(this)
        this.socket.removeEventListener("open", onOpen)
      }
      this.socket.addEventListener("open", onOpen)
    })

    this.socket.addEventListener("open", () => {
      this.emit("open", this)
      this.isOpen = true
    })

    this.socket.addEventListener("close", () => {
      this.end()
      this.isOpen = false
    })

    this.socket.addEventListener("error", err => {
      log("error", err)
    })

    this.socket.addEventListener("message", event => {
      const data = new Uint8Array(event.data)
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
