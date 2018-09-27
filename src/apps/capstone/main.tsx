import * as Preact from "preact"
import App from "../../components/App"
import installRenderErrorHandler from "../../modules/preact-render-error"

// XXX: Remove once preact has error boundaries (or we switch to react)
installRenderErrorHandler()

setTimeout(() => Preact.render(<App />, document.body), 1000)
