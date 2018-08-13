export default class StorageProxy {
  constructor() {
    navigator.serviceWorker.addEventListener('message', this.onMessage)
  }
  sendMessage(message) {
    return new Promise(function(resolve, reject) {
      var messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = function(event) {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        message,
        [messageChannel.port2]);
    });
  }

  onMessage(event) {
    console.log('received a message')
  }

  registerServiceWorker() {
    navigator.serviceWorker.register('worker.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => this.sendMessage('hello from frontend'))
      .catch((error) => console.log(error));
  }
}