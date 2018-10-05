import * as WebSocket from "ws"
import * as Base58 from "bs58"
import { EventEmitter } from "events"
import { Stream } from "stream"
import * as Debug from "debug"
import * as Msg from "./Msg"

Debug.formatters.b = Base58.encode

const log = Debug("discovery-cloud:client")

export interface Info {
  id: string
}

export interface Options {
  id: Buffer
  url: string
  stream: (info: Info) => Stream
  [k: string]: unknown
}

export default class DiscoveryCloudClient extends EventEmitter {
  id: string
  selfKey: Buffer
  url: string
  isOpen: boolean = false
  channels: Set<string> = new Set()
  peers: Map<string, WebSocket> = new Map()
  discovery: WebSocket

  constructor(opts: Options) {
    super()

    this.selfKey = opts.id
    this.id = Base58.encode(opts.id)
    this.url = opts.url
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
      .on("open", () => {
        log("open")
        this.isOpen = true
        this.sendHello()
      })
      .on("close", () => {
        log("closed... reconnecting in 5s")
        this.isOpen = false
        this.discovery.terminate()
        setTimeout(() => {
          this.connectDiscovery()
        }, 5000)
      })
      .on("message", data => this.receive(JSON.parse(data as string)))
      .on("error", err => {
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
    const url = `${this.url}/connect/${this.id}/${id}`
    const socket = new WebSocket(url)
      .on("open", () => {
        log("peer open", id, channels)
      })
      .on("close", () => {
        log("peer close")
      })
      .on("message", data => {
        log("peer message", data)
      })
      .on("error", err => {
        log("Error", err)
      })

    this.peers.set(id, socket)
  }
}
