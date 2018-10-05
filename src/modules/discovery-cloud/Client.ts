// import * as WebSocket from "ws"
import * as Base58 from "bs58"
import { EventEmitter } from "events"
import { Duplex } from "stream"
import * as Debug from "debug"
import * as Msg from "./Msg"

Debug.formatters.b = Base58.encode

const log = Debug("discovery-cloud:client")

export interface Info {
  channel: Buffer
  live?: boolean
  encrypt?: boolean
  hash?: boolean
}

export interface Options {
  id: Buffer
  url: string
  stream: (info: Info) => Duplex
  [k: string]: unknown
}

export default class DiscoveryCloudClient extends EventEmitter {
  connect: (info: Info) => Duplex
  id: string
  selfKey: Buffer
  url: string
  isOpen: boolean = false
  channels: Set<string> = new Set()
  peers: Map<string, WebSocketStream> = new Map()
  discovery: WebSocket

  constructor(opts: Options) {
    super()

    this.selfKey = opts.id
    this.id = Base58.encode(opts.id)
    this.url = opts.url
    this.connect = opts.stream
    this.connectDiscovery()

    log("Initialized %o", opts)
  }

  join(channelBuffer: Buffer) {
    log("join %b", channelBuffer)

    const channel = Base58.encode(channelBuffer)
    this.channels.add(channel)

    if (this.isOpen) {
      this.send({
        type: "Join",
        id: this.id,
        join: [channel],
      })
    }
  }

  leave(channelBuffer: Buffer) {
    log("leave %b", channelBuffer)

    const channel = Base58.encode(channelBuffer)
    this.channels.delete(channel)

    if (this.isOpen) {
      this.send({
        type: "Leave",
        id: this.id,
        leave: [channel],
      })
    }
  }

  listen(_port: unknown) {
    // NOOP
  }

  private connectDiscovery() {
    const url = `${this.url}/discovery`

    log("connectDiscovery", url)

    this.discovery = new WebSocket(url)
    this.discovery.addEventListener("open", () => {
      log("open")
      this.isOpen = true
      this.sendHello()
    })
    this.discovery.addEventListener("close", () => {
      log("closed... reconnecting in 5s")
      this.isOpen = false
      // this.discovery.terminate()
      setTimeout(() => {
        this.connectDiscovery()
      }, 5000)
    })
    this.discovery.addEventListener("message", event =>
      this.receive(JSON.parse(event.data)),
    )
    this.discovery.addEventListener("error", err => {
      log("error", err)
    })

    return this.discovery
  }

  private sendHello() {
    this.send({
      type: "Hello",
      id: this.id,
      join: [...this.channels],
    })
  }

  private send(msg: Msg.ClientToServer) {
    log("send %o", msg)
    this.discovery.send(JSON.stringify(msg))
  }

  private receive(msg: Msg.ServerToClient) {
    log("receive %o", msg)

    switch (msg.type) {
      case "Connect":
        this.onPeer(msg.peerId, msg.peerChannels)

        break // NOOP
    }
  }

  private onPeer(id: string, channels: string[]) {
    const wireToPeer = this.peers.get(id) || this.createPeer(id)

    channels.forEach(channel => {
      const local = this.connect({
        channel: Base58.decode(channel),
        live: true,
        encrypt: false,
        hash: false,
      })

      if (wireToPeer.socket.readyState === WebSocket.OPEN) {
        wireToPeer.pipe(local).pipe(wireToPeer)
      } else {
        wireToPeer.on("open", () => {
          wireToPeer.pipe(local).pipe(wireToPeer)
        })
      }

      wireToPeer.on("error", err => {
        log("error", err)
      })
    })
  }

  private createPeer(id: string): WebSocketStream {
    const url = `${this.url}/connect/${this.id}/${id}`
    const stream = new WebSocketStream(url)

    this.peers.set(id, stream)

    return stream
  }
}

class WebSocketStream extends Duplex {
  socket: WebSocket

  constructor(url: string) {
    super()
    this.socket = new WebSocket(url)

    this.socket.addEventListener("error", err => {
      log("socket error", err)
    })
    this.socket.addEventListener("open", () => {
      this.emit("open")
    })
    this.socket.addEventListener("message", event => {
      log("peerdata from socket", event.data)
      if (!this.push(event.data)) {
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
