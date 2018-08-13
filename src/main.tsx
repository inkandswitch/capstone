import * as Preact from "preact"
import App from "./components/App"
import backendComms from "./backend-comms"

backendComms("message")

setTimeout(() => Preact.render(<App />, document.body), 1000)
