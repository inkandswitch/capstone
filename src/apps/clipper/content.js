document.body.style.backgroundColor = "orange"

// The ID of the extension we want to talk to.
var capstoneExtensionId = "chockaehepbpnfkjbagoinpcpbbmbllm"

// Make a simple request:
chrome.runtime.sendMessage(
  capstoneExtensionId,
  { "content script": "data" },
  response => {
    console.log("Received response from capstone", response)
  },
)
