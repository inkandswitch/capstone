let express = require('express');
let app = express();
let expressWs = require('express-ws')(app);

function mergeUniq(base = [], add = [], remove = []) {
  return base.concat(add).reduce((acc,val) => acc.includes(val) || remove.includes(val) ? acc : acc.concat(val),[])
}

class DiscoveryCloudServer {

  constructor({ port } = {}) {
    this.port = port || 8080
    this.peers = {}
    this.peerKeys = {}
    this.looking = {}
  }

  applyPeers(id,join,leave) {
    this.peerKeys[id] = mergeUniq(this.peerKeys[id], join, leave)
  }

  send(id, message) {
    if (this.peers[id]) {
      this.peers[id].send(JSON.stringify(message))
    } else {
      console.log("error - trying to send to bad peer", id)
    }
  }

  ifUnion(id1, id2, cb) {
    console.log("If union",id1,id2)
    if (id1 != id2) {
      console.log("ALL",this.peerKeys)
      const k1 = this.peerKeys[id1] || []
      console.log("k1",k1)
      const k2 = this.peerKeys[id2] || []
      console.log("k2",k2)
      const union = k1.filter(val => k2.includes(val))
      console.log("union",union)
      if (union.length > 0) {
        console.log("union!",id1,id2)
        cb(union)
      }
    }
  }

  notifyUnions(id1) {
    for (const id2 in this.peers) {
      this.ifUnion(id1, id2, (keys) => {
        this.send(id1, { type: "Connect", peerId: id2, peerChannels: keys })
        this.send(id2, { type: "Connect", peerId: id1, peerChannels: keys })
      })
    }
  }

  listen() {
    app.use(function (req, res, next) {
      console.log("middleware", req.url)
      return next();
    });


    app.get('/', (req, res, next) => {
      console.log("get /");
      res.end();
    });

    app.ws('/discovery', (ws, req) => {
      console.log("discovery connection")
      let id = null
      ws.on('message', (data) => {
        // {id:id,join:[...],leave:[...]}
        console.log("message",data);
        const msg = JSON.parse(data)
        id = msg.id
        this.peers[id] = ws
        this.applyPeers(msg.id,msg.join,msg.leave)
        this.notifyUnions(msg.id)
      });
      const cleanup = () => {
        if (id) {
          delete this.peers[id]
          delete this.peerKeys[id]
        }
      }
      ws.on('error', cleanup)
      ws.on('close', cleanup)
    });

    app.ws('/connect/:peer1/:peer2', (ws, req) => {
      const key1 = req.params.peer1 + ":" + req.params.peer2
      const key2 = req.params.peer2 + ":" + req.params.peer1

      if (this.looking[key2]) {
        const other = this.looking[key2]
        delete this.looking[key2]
        console.log("piping", key1)
        other.pipe(ws).pipe(other)
      } else {
        this.looking[key1] = ws
        const cleanup = () => (delete this.looking[key1])
        ws.on('close', cleanup)
        ws.on('error', cleanup)
      }
    })

    app.listen(this.port, "0.0.0.0", (err) => {
      console.log("Listening on port",this.port)
    });
  }
}

const server = new DiscoveryCloudServer()
server.listen()
