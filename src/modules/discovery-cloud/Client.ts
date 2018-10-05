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
  channels: Set<string> = new Set()
  peers: Map<string, WebSocket> = new Map()
  discovery: WebSocket

  constructor(opts: Options) {
    super()

    this.selfKey = opts.id
    this.id = Base58.encode(opts.id)
    this.url = opts.url
    this.discovery = this.connectDiscovery(this.url)

    log("Initialized %o", opts)
  }

  connectDiscovery(url: string) {
    return new WebSocket(`${url}/discovery`)
      .on("open", () => {
        log("open")
        // TODO send keys
      })
      .on("message", data => this.receive(JSON.parse(data as string)))
      .on("error", err => {
        log("Error", err)
      })
  }

  join(dkey: Buffer) {
    log("join %b", dkey)

    const channel = Base58.encode(dkey)
    this.channels.add(channel)

    this.send({
      type: "Join",
      channel,
    })
  }

  leave(dkey: Buffer) {
    log("leave %b", dkey)

    const channel = Base58.encode(dkey)
    this.channels.delete(channel)
  }

  listen(_port: number) {
    // NOOP
  }

  send(msg: Msg.ClientToServer) {
    this.discovery.send(JSON.stringify(msg))
  }

  receive(msg: Msg.ServerToClient) {
    switch (msg.type) {
      case "Connect":
        this._onPeer(msg.peerId, msg.peerChannels)

        break // NOOP
    }
  }

  _onPeer(id: string, channels: string[]) {
    const url = `${this.url}/peers/${this.id}/${id}`
    const socket = new WebSocket(url)
      .on("open", () => {
        log("peer open", url)
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
