import { Duplex } from "stream"
import * as Debug from "debug"
import * as Base58 from "bs58"
import WebSocketStream from "./WebSocketStream"

const log = Debug("discovery-cloud:ClientPeer")

export interface Info {
  channel: Buffer
  discoveryKey: Buffer
  live?: boolean
  encrypt?: boolean
  hash?: boolean
}

interface Options {
  id: string
  url: string
  stream: (info: Info) => Duplex
}

export default class ClientPeer {
  id: string
  url: string
  stream: (info: Info) => Duplex
  connections: Map<string, WebSocketStream> = new Map() // channel -> socket

  constructor({ url, id, stream }: Options) {
    this.url = url
    this.id = id
    this.stream = stream
  }

  add(channel: string) {
    if (this.connections.has(channel)) return

    const url = [this.url, this.id, channel].join("/")
    const socket = new WebSocketStream(url)

    this.connections.set(channel, socket)

    const local = this.stream({
      channel: Base58.decode(channel),
      discoveryKey: Base58.decode(channel),
      live: true,
      encrypt: false,
      hash: false,
    })

    socket.ready.then(socket => local.pipe(socket).pipe(local))

    socket.on("error", err => {
      log("socket.onerror %s", this.id, err)
    })

    socket.once("end", () => {
      this.remove(channel)
    })

    socket.once("close", () => {
      this.remove(channel)
    })
  }

  remove(channel: string) {
    log("%s removing connection: %s", this.id, channel)
    this.connections.delete(channel)
  }
}
