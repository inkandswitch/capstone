document.body.style.backgroundColor = "red"

import freezeDry from "freeze-dry"

// The ID of the extension we want to talk to.
var capstoneExtensionId = "oiemcadceddgdehdimlfdajbkdjcdkdb"

console.log("prefreeze")
freezeDry(document, { addMetadata: true }).then(html => {
  console.log("froze", html)
  // Make a simple request:
  chrome.runtime.sendMessage(capstoneExtensionId, { html }, response => {
    console.log("Capstone got the HTML: ", response)
  })
})
