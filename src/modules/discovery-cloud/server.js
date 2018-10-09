let express = require("express")
let app = express()
let expressWs = require("express-ws")(app)
let log = require("debug")("discovery-cloud:server")

function mergeUniq(base = [], add = [], remove = []) {
  return base
    .concat(add)
    .reduce(
      (acc, val) =>
        acc.includes(val) || remove.includes(val) ? acc : acc.concat(val),
      [],
    )
}

class DiscoveryCloudServer {
  constructor({ port } = {}) {
    this.port = port || 8080
    this.peers = {}
    this.peerKeys = {}
    this.looking = {}
  }

  applyPeers(id, join, leave) {
    this.peerKeys[id] = mergeUniq(this.peerKeys[id], join, leave)
  }

  send(id, message) {
    if (this.peers[id]) {
      this.peers[id].send(JSON.stringify(message))
    } else {
      log("error - trying to send to bad peer", id)
    }
  }

  ifIntersection(id1, id2, cb) {
    if (id1 != id2) {
      const k1 = this.peerKeys[id1] || []
      const k2 = this.peerKeys[id2] || []
      const intersection = k1.filter(val => k2.includes(val))
      if (intersection.length > 0) {
        cb(intersection)
      }
    }
  }

  notifyIntersections(id1) {
    for (const id2 in this.peers) {
      this.ifIntersection(id1, id2, keys => {
        this.send(id1, { type: "Connect", peerId: id2, peerChannels: keys })
        this.send(id2, { type: "Connect", peerId: id1, peerChannels: keys })
      })
    }
  }

  join(ws1, ws2) {
    ws1.on("message", data => {
      log("pipe -> ", data)
      ws2.send(data)
    })
    ws2.on("message", data => {
      log("pipe <- ", data)
      ws1.send(data)
    })
    const cleanup = () => {
      log("cleaning up joined pipes")
      ws1.close()
      ws2.close()
    }
    w1.on("error", cleanup)
    w2.on("error", cleanup)
    w1.on("close", cleanup)
    w2.on("close", cleanup)
  }

  listen() {
    app.use(function(req, res, next) {
      log("middleware", req.url)
      return next()
    })

    app.get("/", (req, res, next) => {
      log("get /")
      res.end()
    })

    app.ws("/discovery/:id", (ws, req) => {
      log("discovery connection")
      const { id } = req.params
      this.peers[id] = ws

      ws.on("message", data => {
        // {id: id, join: [...], leave: [...]}
        log("message", data)
        const msg = JSON.parse(data)
        this.applyPeers(id, msg.join, msg.leave)
        this.notifyIntersections(id)
      })
      ws.on("close", () => {
        delete this.peers[id]
        delete this.peerKeys[id]
      })
    })

    app.ws("/connect/:peer1/:peer2/:channel", (ws, req) => {
      const { peer1, peer2, channel } = req.params
      const key1 = [peer1, peer2, channel].join(":")
      const key2 = [peer2, peer1, channel].join(":")

      if (this.looking[key2]) {
        const other = this.looking[key2]
        delete this.looking[key2]
        log("piping", key1)
        this.join(ws, other)
      } else {
        log("holding connection - waiting for peer", key1, key2)
        this.looking[key1] = ws
        ws.on("close", () => delete this.looking[key1]) // race condition?
      }
    })

    app.listen(this.port, "0.0.0.0", err => {
      log("Listening on port", this.port)
    })
  }
}

const server = new DiscoveryCloudServer()
server.listen()
