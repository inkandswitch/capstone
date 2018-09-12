#!/usr/bin/env node

const cp = require("child_process")
const path = require("path")

const app = process.argv[2]

const chrome = path.join(__dirname, "chrome.js")
const appPath = path.join(__dirname, "..", "dist", app)

cp.execFile(chrome, [`--load-and-launch-app=${appPath}`])
