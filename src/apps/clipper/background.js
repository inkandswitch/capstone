// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"

chrome.contextMenus.onClicked.addListener(itemData => {
  triggerActionFeedback()
  console.log(itemData)
  if (itemData.selectionText) {
    chrome.runtime.sendMessage(
      capstoneExtensionId,
      { contentType: "Text", content: itemData.selectionText },
      response => {
        console.log("Capstone appears to have received the Text.")
      },
    )
  }
  if (itemData.mediaType === "image") {
    const tmpImage = new Image()
    const canvas = document.createElement("canvas")

    tmpImage.crossOrigin = "anonymous"
    tmpImage.src = itemData.srcUrl

    tmpImage.onload = function() {
      canvas.width = tmpImage.width
      canvas.height = tmpImage.height

      const context = canvas.getContext("2d")
      context.drawImage(tmpImage, 0, 0)

      chrome.runtime.sendMessage(
        capstoneExtensionId,
        { contentType: "Image", content: canvas.toDataURL() },
        response => {
          console.log("Capstone appears to have received the Text.")
        },
      )
    }
  }
})

chrome.contextMenus.create({
  id: "capstone-clipper",
  title: "Send to Capstone",
  contexts: ["selection", "image"], // ContextType
})

chrome.browserAction.onClicked.addListener(function(tab) {
  triggerActionFeedback()
  chrome.tabs.executeScript({
    file: "content.js",
  })
})

function triggerActionFeedback() {
  chrome.browserAction.setBadgeText({ text: "OK" })
  chrome.browserAction.setBadgeBackgroundColor({ color: "green" })
  setTimeout(() => {
    chrome.browserAction.setBadgeText({ text: "" })
    chrome.browserAction.setBadgeBackgroundColor({ color: "green" })
  }, 1000)
}
