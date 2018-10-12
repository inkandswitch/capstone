function init() {
  document.getElementById("archive").addEventListener("click", () => {
    chrome.tabs.executeScript({ file: "content.js" })
  })

  var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"

  var input = document.getElementById("noteInput")

  document.getElementById("noteForm").addEventListener("submit", e => {
    e.preventDefault()

    const form = e.target
    const content = form[0].value
    if (content) {
      chrome.runtime.sendMessage(
        capstoneExtensionId,
        { contentType: "Text", content },
        response => {
          console.log("Capstone appears to have received the Text.")
        },
      )
    }

    form.reset()
    window.close()
  })
}

document.addEventListener("DOMContentLoaded", init)
