process.env["DEBUG"] = "*"

import DiscoveryCloudClient from "./Client"
import { Stream } from "stream"
import * as Debug from "debug"
let hypercore = require("hypercore")
let crypto = require("hypercore/lib/crypto")
let ram = require("random-access-memory")

const log1 = Debug("discovery-cloud:test:client1")
const log2 = Debug("discovery-cloud:test:client2")

const url = "wss://discovery-cloud.herokuapp.com"
//const url = "ws://0.0.0.0:8080"
const keys = crypto.keyPair()

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
