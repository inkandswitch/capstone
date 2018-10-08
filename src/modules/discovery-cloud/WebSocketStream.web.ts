import * as WebSocket from "ws"
import * as Debug from "debug"
import { Duplex } from "stream"

const log = Debug("discovery-cloud:websocket")

export default class WebSocketStream extends Duplex {
  socket: WebSocket
  isOpen: boolean

  constructor(url: string) {
    super()
    this.socket = new WebSocket(url)
      .on("open", () => {
        this.isOpen = true
      })
      .on("close", () => {
        this.isOpen = false
      })
      .on("error", err => {
        log("error", err)
      })
      .on("message", event => {
        const data = event.binaryData
        log("peerdata from socket", data)
        if (!this.push(data)) {
          log("stream closed, cannot write")
          this.socket.close()
        }
      })
  }

  _write(data: Buffer, _: unknown, cb: () => void) {
    log("peerdata to socket", data)

    this.socket.send(data)
    cb()
  }

  _read() {}

  _destroy(err: Error | null, cb: (error: Error | null) => void) {
    if (err) {
      // this.socket.emit("error", err)
      // this.socket.terminate()
      cb(null)
    }
  }

  _final(cb: (error?: Error | null | undefined) => void) {
    this.socket.close()
    cb()
  }
}
