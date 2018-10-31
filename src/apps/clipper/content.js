import freezeDry from "freeze-dry"

var capstoneExtensionId = "gcdcngjcmfebohcjojfbfkmpenlfjcfc"

freezeDry(document, { addMetadata: true }).then(html => {
  const msg = { contentType: "HTML", src: window.location.href, content: html }

  chrome.runtime.sendMessage(capstoneExtensionId, msg, response => {
    console.log("Capstone got the HTML.")
  })
})
