import * as Preact from "preact"
import { delay, clamp, isEmpty, size } from "lodash"
import * as Widget from "./Widget"
import Pen, { PenEvent } from "./Pen"
import Content, {
  DocumentActor,
  Message,
  FullyFormedMessage,
  DocumentCreated,
} from "./Content"
import * as Reify from "../data/Reify"
import * as UUID from "../data/UUID"
import { AnyDoc } from "automerge/frontend"
import * as Position from "../logic/Position"
import StrokeRecognizer, {
  StrokeSettings,
  InkStrokeEvent,
  GlyphEvent,
  Glyph,
} from "./StrokeRecognizer"
import Clipboard from "./Clipboard"

const WebClippingIcon = require("../assets/WebClipping_icon.svg")

const WEBCLIPPING_PADDING = 15

export interface Model {
  title: string
  htmlContent: string
}

interface Props extends Widget.Props<Model> {
  onNavigate?: (url: string) => void
}

interface State {
  urlInput: string
}

class WebClipping extends Preact.Component<Props, State> {
  webClippingEl?: HTMLElement
  strokesCanvasEl?: HTMLCanvasElement

  static reify(doc: AnyDoc): Model {
    return {
      title: Reify.string(doc.title),
      htmlContent: Reify.string(doc.htmlContent),
    }
  }

  render() {
    const { url, title, htmlContent } = this.props.doc

    if (!url) {
      // xx -- think about fullscreen / preview differently
      return this.renderUrlInput()
    }

    switch (this.props.mode) {
      case "fullscreen":
        return this.renderFullscreen()
      case "embed":
      case "preview":
        return this.renderEmbed()
    }
  }

  renderUrlInput = () => {
    return (
      <div style={style.UrlCard}>
        <div style={style.inputGroup}>
          <i style={style.inputGroupIcon} className="fa fa-link" />
          <input
            autofocus
            type="text"
            style={style.urlInput}
            value={this.state.urlInput}
            onChange={this.onInputChange}
            onKeyDown={this.onKeyDown}
            onPaste={this.onPaste}
            placeholder="Enter a URL..."
          />
        </div>
      </div>
    )
  }

  renderFullscreen = () => {
    return (
      <div
        style={style.WebClipping}
        ref={(el: HTMLElement) => (this.webClippingEl = el)}
      />
    )
  }

  renderEmbed = () => {
    return (
      <div style={style.Preview.WebClipping}>
        <img style={style.Preview.Icon} src={WebClippingIcon} />
        <div style={style.Preview.TitleContainer}>
          <div style={style.Preview.Title}>doc.title</div>
        </div>
      </div>
    )
  }

  componentDidMount() {
    this.fillContent()
  }

  componentDidUpdate() {
    this.fillContent()
  }

  fillContent() {
    const { htmlContent } = this.props.doc

    this.webClippingEl && (this.webClippingEl.innerHTML = htmlContent)
  }

  onInputChange = (e: any) => {
    this.setState({
      urlInput: e.target.value,
    })
  }

  onKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation()

    if (e.key === "Enter") {
      e.preventDefault()
      this.props.change(doc => {
        const input = this.state.urlInput
        const url = input.indexOf("://") === -1 ? `http://${input}` : input
        doc.url = url
      })
    }
  }

  onPaste = (e: ClipboardEvent) => {
    e.stopPropagation()
  }
}

const style = {
  // XXX: names
  UrlCard: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "white",
    boxSizing: "border-box",
    overflow: "auto",
    position: "relative",
    padding: 12,
    flex: "1 1 auto",
    border: "1px solid var(--colorPaleGrey)",
  },

  urlInput: {
    backgroundColor: "white",
    padding: "4px",
    height: 20,
    flex: 1,
    width: "calc(100% -32px)",
  },
  inputGroup: {
    display: "flex",
    flex: "1 0 auto",
    alignItems: "center",
  },
  inputGroupIcon: {
    fontSize: 24,
    flex: "none",
    color: "#637389",
  },

  WebClipping: {
    width: "100%",
    height: "100%",
    padding: WEBCLIPPING_PADDING,
    position: "absolute",
    zIndex: 0,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  Preview: {
    WebClipping: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      padding: "50px 25px",
      fontSize: 16,
      backgroundColor: "#fff",
    },
    Icon: {
      height: 50,
      width: 50,
    },
    TitleContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      margin: "0 15px",
    },
    Title: {
      fontSize: 24,
      fontWeight: 500,
      lineHeight: "1.2em",
    },
    SubTitle: {
      fontSize: "smaller",
    },
  },
}

export default Widget.create("WebClipping", WebClipping, WebClipping.reify)
