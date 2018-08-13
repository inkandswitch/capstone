self.addEventListener('install', function(event) {
  // Perform install steps
  console.log('Install hook');
})

self.addEventListener('message', function(event) {
  console.log('Handling message event:', event);
})

