import freezeDry from "freeze-dry"

// The ID of the extension we want to talk to.
var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"

freezeDry(document, { addMetadata: true }).then(html => {
  chrome.runtime.sendMessage(
    capstoneExtensionId,
    { contentType: "HTML", content: html },
    response => {
      console.log("Capstone appears to have received the HTML.")
    },
  )
})
