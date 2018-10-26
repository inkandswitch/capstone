import * as React from "react"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"

const withAvailableWidth = require("react-with-available-width")

const IFRAME_DIMENSIONS = {
  width: 1090,
  height: 727,
}

export interface Model {
  html: string
  src: string
  snippet: boolean
}

interface Props extends Widget.Props<Model> {
  availableWidth: number
}

class HTML extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      html: Reify.string(doc.html),
      src: Reify.string(doc.src),
      snippet: Reify.boolean(doc.snippet, () => false),
    }
  }

  render() {
    switch (this.props.doc.snippet) {
      case true:
        return (
          <div style={style.Snippet}>
            <iframe
              frameBorder="0"
              style={style.Snippet__IFrame}
              srcDoc={this.props.doc.html}
            />
          </div>
        )
        break
      case undefined:
      case false:
        switch (this.props.mode) {
          case "fullscreen":
            return (
              <div style={style.Fullscreen}>
                <iframe
                  frameBorder="0"
                  style={style.Fullscreen__IFrame}
                  srcDoc={this.props.doc.html}
                />
                <div style={style.Fullscreen__Banner}>{this.props.doc.src}</div>
              </div>
            )
          case "preview":
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
                  <iframe
                    style={style.Embed__IFrame}
                    srcDoc={this.props.doc.html}
                  />
                </div>
              </div>
            )
        }
        break
    }
  }
}

const style = {
  Fullscreen__Banner: {
    background: "#F6F6F6",
    position: "absolute",
    height: "30px",
    bottom: "0px",
    width: "100%",
    fontSize: "12px",
    fontStyle: "medium",
    textAlign: "center",
    verticalAlign: "center",
    lineHeight: "30px",
    color: "#B4B4B4",
  } as React.CSSProperties,
  Embed: {
    borderRadius: "3px",
    border: "1px solid black",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  } as React.CSSProperties,
  Embed__ScaleWrapper: {
    transform: "scale(0.25)",
    transformOrigin: "0 0",
  },
  Fullscreen: {
    width: "100%",
    height: "100%",
    overflow: "scroll",
  } as React.CSSProperties,
  Fullscreen__IFrame: {
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
  } as React.CSSProperties,
  Embed__IFrame: {
    width: IFRAME_DIMENSIONS.width + "px",
    height: IFRAME_DIMENSIONS.height + "px",
    overflow: "hidden",
    pointerEvents: "none",
  } as React.CSSProperties,
  Snippet: {},
  Snippet__IFrame: {},
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
