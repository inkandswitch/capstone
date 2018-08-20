var swarm = require("discovery-swarm")

var sw = swarm({ utp: false })

sw.listen(1010 + Math.floor(Math.random() * 10))
sw.join("quelle-disastre") // can be any id/name/hash

sw.on("connection", function(connection) {
  console.log("found + connected to peer", connection)
})
