import { EventEmitter } from "events"
import { Stream } from "stream"
import * as bs58 from "bs58"
import * as Debug from "debug"

Debug.formatters.b = bs58.encode

const log = Debug("hypermerge:router-swarm")

export interface Info {
  id: string
}

export interface Options {
  url: string
  stream: (info: Info) => Stream
  [k: string]: unknown
}

export default class RouterClient extends EventEmitter {
  channels: Set<string> = new Set()

  constructor(opts: Options) {
    super()
    log("Initialized %o", opts)
  }

  join(dkey: Buffer) {
    log("join %b", dkey)

    const channel = bs58.encode(dkey)
    this.channels.add(channel)
  }

  leave(dkey: Buffer) {
    log("leave %b", dkey)

    const channel = bs58.encode(dkey)
    this.channels.delete(channel)
  }

  listen(_port: number) {
    // NOOP
  }
}
