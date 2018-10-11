// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({
    file: "content.js",
  })
})

var capstoneExtensionId = "dflegkhjkkcbbnknalnkddcmjpaimcdp"

chrome.contextMenus.onClicked.addListener(itemData => {
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
    console.log("image not quite supported yet")
    // XXX todo
  }
})

chrome.contextMenus.create({
  id: "capstone-clipper",
  title: "Send to Capstone",
  contexts: ["selection", "image"], // ContextType
})
