import { Hypermerge } from "."
import swarm from "./discovery-swarm"

export default function chromeSwarm(hm) {
  const MDNS_PORT = 5307
  const dgram = require("chrome-dgram")
  const socket = dgram.createSocket("udp4")
  const mdns = require("multicast-dns")

  socket.setMulticastTTL(255)
  socket.setMulticastLoopback(true)

  socket.on("error", err => hm.trackError(err))

  chrome.system.network.getNetworkInterfaces(ifaces => {
    socket.on("listening", () => {
      for (let i = 0; i < ifaces.length; i++) {
        if (ifaces[i].prefixLength == 24) {
          socket.addMembership("224.0.0.251", ifaces[i].address)
        }
      }
      const multicast = mdns({
        socket,
        bind: false,
        port: MDNS_PORT,
        multicast: false,
      })
      swarm(hm, {
        dht: false,
        dns: { multicast },
      })
    })
    socket.bind(MDNS_PORT)
  })
}
