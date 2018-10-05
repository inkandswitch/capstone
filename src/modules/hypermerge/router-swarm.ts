import { EventEmitter } from "events"
import { Stream } from "stream"
import { Hypermerge } from "."
import * as bs58 from "bs58"
import * as Debug from "debug"

Debug.formatters.b = bs58.encode

const log = Debug("hypermerge:discovery-swarm")

export interface Info {
  id: string
}

export interface Options {
  stream: (info: Info) => Stream
}

export default function routerSwarm(hm: Hypermerge, opts: Options) {
  return new RouterSwarm(hm, opts)
}

export class RouterSwarm extends EventEmitter {
  channels: Set<string> = new Set()

  constructor(hm: Hypermerge, opts: Options) {
    super()
    console.log(opts)
  }

  join(key: Buffer) {
    log("join %b", key)

    const channel = bs58.encode(key)
    this.channels.add(channel)
  }

  leave(key: Buffer) {
    log("leave %b", key)

    const channel = bs58.encode(key)
    this.channels.delete(channel)
  }

  listen(_port: number) {
    // NOOP
  }
}
