export default function sendMessage(message) {
  // This wraps the message posting/response in a promise, which will resolve if the response doesn't
  // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
  // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
  // a convenient wrapper.
  return new Promise(function(resolve, reject) {
    var messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = function(event) {
      if (event.data.error) {
        reject(event.data.error);
      } else {
        resolve(event.data);
      }
    };

    // This sends the message data as well as transferring messageChannel.port2 to the service worker.
    // The service worker can then use the transferred port to reply via postMessage(), which
    // will in turn trigger the onmessage handler on messageChannel.port1.
    // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
    navigator.serviceWorker.controller.postMessage(message,
      [messageChannel.port2]);
  });
}

navigator.serviceWorker.addEventListener('message', function(event) {
  console.log(event.data);
});

console.log(chrome)
navigator.serviceWorker.register('worker.js')
  // Wait until the service worker is active.
  .then(function() {
    return navigator.serviceWorker.ready;
  })
  .then(() => sendMessage('hello from frontend'))
  // ...and then show the interface for the commands once it's ready.
  .catch(function(error) {
    // Something went wrong during registration. The service-worker.js file
    // might be unavailable or contain a syntax error.
    console.log(error);
  });
