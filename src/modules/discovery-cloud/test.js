
const { DiscoveryCloud } = require('./client')

const dk = new DiscoveryCloud()
dk.join("foo")
dk.join("bar")
dk.listen()
