document.body.style.backgroundColor = "blue"

import freezeDry from "freeze-dry"

// The ID of the extension we want to talk to.
var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"

console.log("prefreeze")
freezeDry(document, { addMetadata: true }).then(html => {
  chrome.runtime.sendMessage(capstoneExtensionId, { html }, response => {
    console.log("Capstone got the HTML!")
  })
})
