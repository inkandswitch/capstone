import * as React from "react"
import * as ReactDOM from "react-dom"
import ControlPanel from "../../components/ControlPanel"
import StoreBackend from "../../data/StoreBackend"

export interface ControlProps {
  store: StoreBackend
}

const ControlPanel = document.getElementById("ControlPanel")!

export function setupControlPanel(store: StoreBackend) {
  ReactDOM.render(<ControlPanel store={store} />, ControlPanel)
}

export function setControlPanel() {
  chrome.storage.local.get("controlPanel", data => {
    ControlPanel.style.display = data.controlPanel
  })
  ControlPanel.style.display =
    ControlPanel.style.display === "block" ? "none" : "block"
}

export function toggleControl() {
  const mode = ControlPanel.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ controlPanel: mode })
  setControlPanel()
}
