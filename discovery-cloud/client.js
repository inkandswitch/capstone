const WebSocket = require('ws');
const crypto = require('crypto');
const Base58 = require('bs58')

class DiscoveryCloud {
  constructor() {
    this.id = Base58.encode(crypto.randomBytes(32))
    this.dks = []
    this.peers = {}
    this.peerKeys = {}
  }

  join(dk) {
    this.dks.push(dk)
    if (this.discovery) this.hello()
  }

  hello() {
    const hello = {
      id: this.id,
      join: this.dks
    }
    this.discovery.send(JSON.stringify(hello))
  }

  peer(id,dks) {
    const url = `ws://0.0.0.0:8080/peer/${this.id}/${id}`
    this.peers[id] = new WebSocket(url)
    this.peers[id].on('open', () => {
      console.log("peer open", url);
    })
    this.peers[id].on('message', (data) => {
      console.log("peer message", data)
    })
    this.peers[id].on('error', (err) => {
      console.log("Error",err)
    })
  }

  listen() {
    console.log("discovey listen");
    this.discovery = new WebSocket('ws://0.0.0.0:8080/discovery')
    this.discovery.on('open', () => {
      console.log("open");
      this.hello()
    })
    this.discovery.on('message', (data) => {
      const msg = JSON.parse(data)
      console.log("discovery message",msg)
      this.peer(msg.id, msg.dks)
    })
    this.discovery.on('error', (err) => {
      console.log("Error",err)
    })
  }
}

module.exports = {
  DiscoveryCloud
}
