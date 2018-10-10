const swarmDefaults = require("dat-swarm-defaults")
const discoverySwarm = require("discovery-swarm")
const Debug = require("debug")
const mdns = require("multicast-dns")

const log = Debug("hypermerge:discovery-swarm")

export default function swarm(hm, opts = {}) {
  log("joinSwarm")

  if (opts.port == null) opts.port = 0

  const multicast = mdns({
    port: 8008,
  })

  let mergedOpts = Object.assign(
    swarmDefaults(),
    {
      hash: false,
      encrypt: true,
      port: 5000,
      dns: { multicast }
      stream: opts => hm.replicate(opts),
    },
    opts,
  )

  // need a better deeper copy
  mergedOpts.dns = Object.assign(swarmDefaults().dns, opts.dns)

  hm.swarm = discoverySwarm(mergedOpts)

  hm.swarm.join(hm.core.archiver.changes.discoveryKey)

  Object.values(hm.feeds).forEach(feed => {
    hm.swarm.join(feed.discoveryKey)
  })

  hm.core.archiver.on("add", feed => {
    hm.swarm.join(feed.discoveryKey)
  })

  hm.core.archiver.on("remove", feed => {
    hm.swarm.leave(feed.discoveryKey)
  })

  hm.swarm.listen(opts.port)

  hm.swarm.once("error", err => {
    log("joinSwarm.error", err)
    hm._swarmStats["error"] = err
    hm.swarm.listen(opts.port)
  })

  const signals = [
    "handshaking",
    "handshake-timeout",
    "listening",
    "connecting",
    "connect-failed",
    "connection",
    "close",
    "redundant-connection",
    "peer",
    "peer-rejected",
    "drop",
    "peer-banned",
    "connection-closed",
    "connect-failed",
  ]
  signals.forEach(signal => {
    hm._swarmStats[signal] = 0
    hm.swarm.on(signal, (arg1, arg2) => {
      hm._swarmStats[signal] += 1
    })
  })

  return this
}
