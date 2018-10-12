function init() {
  document.getElementById("archive").addEventListener("click", () => {
    chrome.tabs.executeScript({ file: "content.js" })
  })

  var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"

  var input = document.getElementById("noteInput")

  document.getElementById("note").addEventListener("click", () => {
    console.log("note")
    chrome.runtime.sendMessage(
      capstoneExtensionId,
      { contentType: "Text", content: input.value },
      response => {
        console.log("Capstone appears to have received the Text.")
      },
    )
  })
}

document.addEventListener("DOMContentLoaded", init)
