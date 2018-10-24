import freezeDry from "freeze-dry"

var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"
var sidecarExtensionId = "jngcacpcikdockopfgangnjgjjlknboe"

freezeDry(document, { addMetadata: true }).then(html => {
  const msg = { contentType: "HTML", src: window.location.href, content: html }

  chrome.runtime.sendMessage(sidecarExtensionId, msg, response => {
    console.log("Sidecar got the HTML.")
  })
  chrome.runtime.sendMessage(capstoneExtensionId, msg, response => {
    console.log("Capstone got the HTML.")
  })
})
