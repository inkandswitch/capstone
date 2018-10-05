process.env["DEBUG"] = "*"

import DiscoveryCloudClient from "./Client"
import { Stream } from "stream"
import * as Debug from "debug"
let hypercore = require("hypercore")
let crypto = require("hypercore/lib/crypto")
let ram = require("random-access-memory")

const log1 = Debug("discovery-cloud:test:client1")
const log2 = Debug("discovery-cloud:test:client2")

const url = "ws://localhost:8080"
// const keys = crypto.keyPair()
const keys = {
  publicKey: Buffer.from(
    "e958afad0b384781ec4479bce2032998c42f2e429e9247be7dcc6aa1e2801788",
    "hex",
  ),
  secretKey: Buffer.from(
    "40dc03cb0963efee9d08047a22ae0ffe56cc06be6c792da7002f3c0637ff302ce958afad0b384781ec4479bce2032998c42f2e429e9247be7dcc6aa1e2801788",
    "hex",
  ),
}

const feed1 = hypercore(ram, keys.publicKey, { secretKey: keys.secretKey })
const feed2 = hypercore(ram, keys.publicKey)

const client1 = new DiscoveryCloudClient({
  id: crypto.randomBytes(32),
  url,
  stream: info => feed1.replicate({ encrypt: false, live: true }),
})

feed1.on("ready", () => {
  client1.join(feed1.discoveryKey)
  log1("joining")
  feed1.append("foo")
  feed1.append("bar")
  feed1.append("baz")
})

const client2 = new DiscoveryCloudClient({
  id: crypto.randomBytes(32),
  url,
  stream: info => feed2.replicate({ encrypt: false, live: true }),
})

feed2.on("ready", () => {
  log2("joining")
  client2.join(feed2.discoveryKey)
})

feed2.on("download", (idx: any, data: any) => {
  log2("downloaded", idx, data.toString())
})
