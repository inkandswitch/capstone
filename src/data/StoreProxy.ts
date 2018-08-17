import { AnyDoc } from "automerge"

type CommandMessage = "Create" | "Open" | "Replace"

export default class StoreProxy {
  serviceWorker: ServiceWorker

  constructor() {
    this.serviceWorker = navigator.serviceWorker!.controller!
    this.registerServiceWorker()
  }

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

  open(id: String): Promise<AnyDoc> {
    return this.sendMessage("Open", { id })
  }

  create(): Promise<AnyDoc> {
    return this.sendMessage("Create")
  }

  replace(doc: AnyDoc): AnyDoc {
    this.sendMessage("Replace", { doc })
    return doc
  }

  registerServiceWorker() {
    navigator.serviceWorker
      .register("worker.js")
      .then(() => navigator.serviceWorker.ready)
      .catch(error => console.log(error))
  }
}
