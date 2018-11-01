// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var capstoneExtensionId = "gcdcngjcmfebohcjojfbfkmpenlfjcfc"

function sendMessage(msg) {
  chrome.runtime.sendMessage(capstoneExtensionId, msg, response =>
    console.log("Capstone received the message.", msg, response),
  )
}

chrome.contextMenus.onClicked.addListener(itemData => {
  triggerActionFeedback()
  console.log(itemData)
  if (itemData.selectionText) {
    chrome.tabs.executeScript(
      {
        code: "window.getSelection().toString();",
      },
      selection => {
        sendMessage({ contentType: "Text", content: selection[0] })
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

      sendMessage({ contentType: "Image", content: canvas.toDataURL() })
    }
  }
})

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "capstone-clipper",
    title: "Send to Capstone",
    contexts: ["selection", "image"], // ContextType
  })
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
