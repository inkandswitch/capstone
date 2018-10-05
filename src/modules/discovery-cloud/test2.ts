process.env["DEBUG"] = "*"

import DiscoveryCloudClient from "./Client"
import { Stream } from "stream"
let hypercore = require("hypercore")
let crypto = require("hypercore/lib/crypto")
let ram = require("random-access-memory")

const url = "ws://localhost:8080"
const keys = crypto.keyPair()

const feed1 = hypercore(ram, keys.publicKey, { secretkey: keys.secretKey })
const feed2 = hypercore(ram, keys.publicKey)

const client1 = new DiscoveryCloudClient({
  id: crypto.randomBytes(32),
  url,
  stream: info => feed1.replicate(info),
})

feed1.on("ready", () => {
  client1.join(feed1.discoveryKey)
  feed1.append("foo", () => {
    console.log("appended")
  })
})

const client2 = new DiscoveryCloudClient({
  id: crypto.randomBytes(32),
  url,
  stream: info => feed2.replicate(info),
})

feed2.on("ready", () => {
  client2.join(feed2.discoveryKey)
})
