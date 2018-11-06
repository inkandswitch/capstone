import * as React from "react"
import { Reify, Widget } from "capstone"
import { AnyDoc } from "automerge/frontend"
import * as css from "./HTML.css"

const withAvailableWidth = require("react-with-available-width")

const IFRAME_DIMENSIONS = {
  width: 1090,
  height: 727,
}

export interface Model {
  html: string
  src: string
}

interface Props extends Widget.Props<Model> {
  availableWidth: number
}

class HTML extends React.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      html: Reify.string(doc.html),
      src: Reify.string(doc.src),
    }
  }

  onLoadIFrame(event: React.SyntheticEvent<HTMLIFrameElement>) {
    const obj = event.target as HTMLIFrameElement
    if (!obj || !obj.contentWindow) return
    obj.style.height = obj.contentWindow.document.body.scrollHeight + "px"
  }

  render() {
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <div className={css.Fullscreen}>
            <iframe
              frameBorder="0"
              className={css.Fullscreen_IFrame}
              srcDoc={this.props.doc.html}
              onLoad={this.onLoadIFrame}
            />
            <div className={css.Fullscreen_Banner}>{this.props.doc.src}</div>
          </div>
        )

      case "preview":
      case "embed": {
        const contentScale =
          (this.props.availableWidth - 4) / IFRAME_DIMENSIONS.width

        const scaleStyle = {
          transform: `scale(${contentScale})`,
          willChange: "transform",
          transformOrigin: "top left",
        }

        const iframeStyle = {
          width: IFRAME_DIMENSIONS.width,
          height: IFRAME_DIMENSIONS.height,
        }

        return (
          <div className={css.Embed}>
            <div style={scaleStyle}>
              <iframe
                frameBorder="0"
                style={iframeStyle}
                className={css.Embed_IFrame}
                srcDoc={this.props.doc.html}
              />
            </div>
          </div>
        )
      }
    }
  }
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
