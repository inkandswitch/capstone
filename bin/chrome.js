#!/usr/bin/env node

// A script to find and run the chrome executable and forward any passed
// in command line flags

const cp = require("child_process")
const os = require("os")
const path = require("path")

cp.execFile(chromePath(), args())

function args() {
  return process.argv.slice(2) // remove "node" and "scripts/chrome.js"
}

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME

  switch (os.platform()) {
    case "win32":
      return path.join("C:", windowsPath())

    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    case "linux":
      if (os.release().includes("Microsoft")) {
        return path.join("/mnt/c", windowsPath())
      } else {
        return "/opt/google/chrome/chrome"
      }

    default:
      throw new Error("Could not find Chrome executable")
  }
}

function windowsPath() {
  const programFiles =
    process.arch === "x64" ? "Program Files (x86)" : "Program Files"

  return path.join(
    programFiles,
    "Google",
    "Chrome",
    "Application",
    "chrome.exe",
  )
}
