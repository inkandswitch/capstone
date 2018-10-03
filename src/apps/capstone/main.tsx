import * as Preact from "preact"
import App from "../../components/App"
import Content from "../../components/Content"
import Store from "../../data/Store"
import installRenderErrorHandler from "../../modules/preact-render-error"

// XXX: Remove once preact has error boundaries (or we switch to react)
installRenderErrorHandler()

// Used for debugging from the console:
window.Content = Content
const socket = new WebSocket(`ws://${LOCAL_IP}:8585`)

Content.store = new Store(msg => {
  socket.send(JSON.stringify(msg))
})

socket.addEventListener("open", () => {
  setTimeout(() => Preact.render(<App />, document.body), 1000)
  console.log("Connected to backend")
})

socket.addEventListener("message", event => {
  Content.store.onMessage(JSON.parse(event.data))
})

Content.store.presence().subscribe(presenceInfo => {
  console.log(presenceInfo)
})
