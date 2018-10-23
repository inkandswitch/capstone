import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"

const withAvailableWidth = require("react-with-available-width")

const IFRAME_DIMENSIONS = {
  width: 2400,
  height: 1600,
}

export interface Model {
  html: string
}

interface Props extends Widget.Props<Model> {
  availableWidth: number
}

interface State {
  encodedHtml: string
}

class HTML extends React.Component<Props, State> {
  static reify(doc: AnyDoc): Model {
    return {
      html: Reify.string(doc.html),
    }
  }

  state = { encodedHtml: "" }

  componentWillReceiveProps() {
    this.setState({
      encodedHtml:
        "data:text/html;base64," +
        btoa(unescape(encodeURIComponent(this.props.doc.html))),
    })
  }

  render() {
    const { encodedHtml } = this.state
    switch (this.props.mode) {
      case "fullscreen":
        return <iframe style={style.Fullscreen} src={encodedHtml} />
      case "embed":
        const contentScale =
          (this.props.availableWidth - 4) / IFRAME_DIMENSIONS.width
        //const { scale } = this.props
        const scaleStyle = {
          transform: `scale(${contentScale})`,
          willChange: "transform",
          transformOrigin: "top left",
        }

        return (
          <div style={style.Embed}>
            <div style={scaleStyle}>
              <iframe style={style.Embed__IFrame} src={encodedHtml} />
            </div>
          </div>
        )
    }
  }
}

const style = {
  Fullscreen: {},
  Embed: {
    borderRadius: "6px",
    border: "2px solid black",
    pointerEvents: "none",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  } as React.CSSProperties,
  Embed__ScaleWrapper: {
    transform: "scale(0.25)",
    transformOrigin: "0 0",
  },
  IFrame: {
    width: IFRAME_DIMENSIONS.width + "px",
    height: IFRAME_DIMENSIONS.height + "px",
  },
  Embed__IFrame: {
    width: IFRAME_DIMENSIONS.width + "px",
    height: IFRAME_DIMENSIONS.height + "px",
    overflow: "hidden",
  },
}

export default Widget.create(
  "HTML",
  withAvailableWidth(HTML, (domElement: HTMLElement, notify: () => void) => {
    const observer = new ResizeObserver(() => notify())
    observer.observe(domElement)
    return () => observer.unobserve(domElement)
  }),
  HTML.reify,
)
