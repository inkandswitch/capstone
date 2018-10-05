import * as ws from "ws"

/**
 * TODO:
 * - connect to router via websocket
 * - not sure we need channels, i think we can just replicate to the same websocket per peer
 * - peer connects to server and sends channel name
 * - we cache channel names for each peer
 * - a peer connects and "joins" a channel
 * - we wire-up peers that have the same channel
 */

export class Router {
  server: ws.Server
  sockets: { [id: string]: ws.Server }

  constructor(opts: ws.ServerOptions) {
    this.server = new ws.Server({
      clientTracking: true,
      ...opts,
    })

    this.server
      .addListener("listening", this._onListening)
      .addListener("connection", this._onConnection)
  }

  _onListening = () => {
    console.log("Router listening")
  }

  _onConnection = (conn: ws) => {
    console.log("Incoming connection")
    conn.addListener("message", this._onMessage)
  }

  _onMessage = (data: ws.Data) => {
    console.log("Incoming data")
  }
}
