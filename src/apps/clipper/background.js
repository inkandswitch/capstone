// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({
    file: "content.js",
  })
})

// The ID of the extension we want to talk to.
var capstoneExtensionId = "chockaehepbpnfkjbagoinpcpbbmbllm"

// Make a simple request:
chrome.runtime.sendMessage(
  capstoneExtensionId,
  { "other extension": "data" },
  response => {
    console.log("Received response from capstone", response)
  },
)
