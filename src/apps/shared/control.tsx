import * as React from "react"
import * as ReactDOM from "react-dom"
import ControlPanel from "../../components/ControlPanel"
import StoreBackend from "../../data/StoreBackend"

export interface ControlProps {
  store: StoreBackend
}

const ControlPanelDOM = document.getElementById("ControlPanel")!

export function setupControlPanel(store: StoreBackend) {
  ReactDOM.render(<ControlPanel store={store} />, ControlPanelDOM)
}

export function setControlPanel() {
  chrome.storage.local.get("controlPanel", data => {
    ControlPanelDOM.style.display = data.controlPanel
  })
  ControlPanelDOM.style.display =
    ControlPanelDOM.style.display === "block" ? "none" : "block"
}

export function toggleControl() {
  const mode = ControlPanelDOM.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ controlPanel: mode })
  setControlPanel()
}
