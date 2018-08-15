import Store from './store'

this.store = new Store()

self.addEventListener('install', function(event) {
  // Perform install steps
  console.log('Install hook');
}) 

self.addEventListener('message', (event) => {
  let { command, id, doc } = event.data
  switch (command) {
    case "OpenDoc":
      return event.ports[0].postMessage(this.store.open(id))
    case "Update":
      return this.docs[id] = doc
  }

})

