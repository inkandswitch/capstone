import { Doc, AnyDoc, ChangeFn } from "automerge"

type CommandMessage = "Create" | "Open" | "Replace"

const Hypercore = require("hypercore")
var ram = require("random-access-memory")
const HyperDiscovery = require("hyperdiscovery")

var swarm = require("discovery-swarm")

var sw = swarm({ utp: false, dht: false })

sw.listen(1000)
sw.join("quelle-disastre") // can be any id/name/hash

sw.on("connection", function(connection: any) {
  console.log("found + connected to peer")
})

export default class Store {
  serviceWorker: ServiceWorker

  constructor() {
    this.serviceWorker = navigator.serviceWorker!.controller!
    this.registerServiceWorker()
  }

  core = new Hypercore(ram)

  dontKeepThisCurrentId = 0

  sendMessage(command: CommandMessage, args: any = {}): Promise<AnyDoc> {
    return new Promise((resolve, reject) => {
      var messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error)
        } else {
          resolve(event.data)
        }
      }
      this.serviceWorker.postMessage({ command, args }, [messageChannel.port2])
    })
  }

  open(id: string): Promise<AnyDoc> {
    return this.sendMessage("Open", { id })
  }

  create(): Promise<string> {
    return new Promise((resolve, reject) => {
      var messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error)
        } else {
          resolve(event.data)
        }
      }
      const command = "Create"
      this.serviceWorker.postMessage({ command: "Create" }, [
        messageChannel.port2,
      ])
    })
  }

  replace(id: string, doc: AnyDoc): AnyDoc {
    this.sendMessage("Replace", { id, doc })
    return doc
  }

  change<T>(
    id: string,
    doc: Doc<T>,
    msg: string,
    cb: ChangeFn<T>,
  ): Promise<Doc<T>> {
    return new Promise(
      (resolve, reject) =>
        doc
          ? resolve(this.replace(id, cb(doc)) as Doc<T>)
          : reject(new Error("replace failed")),
    )
  }

  registerServiceWorker() {
    navigator.serviceWorker
      .register("worker.js")
      .then(() => navigator.serviceWorker.ready)
      .catch(error => console.log(error))
  }
}
