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

const WebClippingIcon = require("../assets/WebClipping_icon.svg")

const WEBCLIPPING_PADDING = 15

export interface Model {
  title: string
  htmlContent: string
}

interface Props extends Widget.Props<Model> {
  onNavigate?: (url: string) => void
}

class WebClipping extends Preact.Component<Props> {
  webClippingEl?: HTMLElement
  strokesCanvasEl?: HTMLCanvasElement

  static reify(doc: AnyDoc): Model {
    return {
      title: Reify.string(doc.title),
      htmlContent: Reify.string(doc.htmlContent),
    }
  }

  render() {
    const { title, htmlContent } = this.props.doc
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <div
            style={style.WebClipping}
            ref={(el: HTMLElement) => (this.webClippingEl = el)}
          />
        )
      case "embed":
      case "preview":
        return (
          <div style={style.Preview.WebClipping}>
            <img style={style.Preview.Icon} src={WebClippingIcon} />
            <div style={style.Preview.TitleContainer}>
              <div style={style.Preview.Title}>doc.title</div>
            </div>
          </div>
        )
    }
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
}

const style = {
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
