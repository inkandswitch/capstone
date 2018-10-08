import { EventEmitter } from "events"
import WebSocketStream from "./WebSocketStream"
import * as Base58 from "bs58"
import * as Debug from "debug"
import * as Msg from "./Msg"
import { Duplex } from "stream"

Debug.formatters.b = Base58.encode

const log = Debug("discovery-cloud:Client")

export interface Peer {
  id: string
  socket: WebSocketStream
  channels: string[]
}

export interface Info {
  channel: Buffer
  discoveryKey: Buffer
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
  channels: Set<string> = new Set()
  peers: Map<string, Peer> = new Map()
  discovery: WebSocketStream

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

    if (this.discovery.isOpen) {
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

    if (this.discovery.isOpen) {
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

    this.discovery = new WebSocketStream(url)
      .on("open", () => {
        this.sendHello()
      })
      .on("end", () => {
        log("discovery.onend... reconnecting in 5s")
        setTimeout(() => {
          this.connectDiscovery()
        }, 5000)
      })
      .on("data", data => {
        log("discovery.ondata", data)
        this.receive(JSON.parse(data))
      })
      .on("error", err => {
        log("discovery.onerror", err)
      })
  }

  private sendHello() {
    this.send({
      type: "Hello",
      id: this.id,
      join: [...this.channels],
    })
  }

  private send(msg: Msg.ClientToServer) {
    log("discovery.send %o", msg)
    this.discovery.write(JSON.stringify(msg))
  }

  private receive(msg: Msg.ServerToClient) {
    log("discovery.receive %o", msg)

    switch (msg.type) {
      case "Connect":
        this.onConnect(msg.peerId, msg.peerChannels)
        break
    }
  }

  private onConnect(id: string, channels: string[]) {
    const peer = this.peers.get(id) || this.createPeer(id)

    const newChannels = channels.filter(ch => !peer.channels.includes(ch))

    newChannels.forEach(channel => {
      const local = this.connect({
        channel: Base58.decode(channel),
        discoveryKey: Base58.decode(channel),
        live: true,
        encrypt: false,
        hash: false,
      })

      peer.socket.ready.then(socket => socket.pipe(local).pipe(socket))
    })
    peer.channels = channels
  }

  private createPeer(id: string): Peer {
    const url = `${this.url}/connect/${this.id}/${id}`
    log("connecting %s", url)
    const socket = new WebSocketStream(url)
    const peer = { id, socket, channels: [] }
    this.peers.set(id, peer)

    socket.on("error", err => {
      log("wire.onerror %s", id, err)
    })

    socket.once("end", () => {
      log("wire.onend deleting peer: %s", id)
      this.peers.delete(id)
    })

    socket.once("close", () => {
      log("wire.onclose deleting peer: %s", id)
      this.peers.delete(id)
    })

    return peer
  }
}
