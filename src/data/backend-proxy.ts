type CommandMessage = 
    "OpenDoc"
  | "Change"

export default class BackendProxy {
  serviceWorker: ServiceWorker

  constructor() {
    navigator.serviceWorker.addEventListener('message', this.onMessage)
    this.serviceWorker = navigator.serviceWorker!.controller!
  }

  sendMessage(command: CommandMessage, args: any) {
    return new Promise(function(resolve, reject) {
      var messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      }
      this.serviceWorker.postMessage({command, args}, [messageChannel.port2]);
      })
  }

  onMessage(event: Event) {
    console.log('received a message')
  }

  async openDoc(id: String) {
    return await this.sendMessage("OpenDoc", id)
  }

  registerServiceWorker() {
    navigator.serviceWorker.register('worker.js')
      .then(() => navigator.serviceWorker.ready)
      .catch((error) => console.log(error));
  }
}