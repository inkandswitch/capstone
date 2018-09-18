import * as Preact from "preact"
import Content, { DocumentActor } from "./Content"
import { ShelfContents, ShelfContentsRequested } from "./Shelf"
import StrokeRecognizer, { Stroke, Glyph } from "./StrokeRecognizer"
import * as Reify from "../data/Reify"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge"

interface Model {
  name: string
  documents: string[]
}

type WidgetMessage = ShelfContentsRequested
type InMessage = WidgetMessage | ShelfContents
type OutMessage = ShelfContentsRequested

export class IdentityActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    console.log("on message", message)
    switch (message.type) {
      case "ShelfContentsRequested": {
        console.log("shelf contents requested")
        this.emit({ type: "ShelfContentsRequested" })
        break
      }
      case "ShelfContents": {
        console.log("shelf contents")
        const { urls } = message.body
        this.change(doc => {
          doc.documents = doc.documents.concat(urls)
          return doc
        })
        break
      }
    }
  }
}

interface Props extends Widget.Props<Model, WidgetMessage> {}

export class Identity extends Preact.Component<Props> {
  static reify(doc: AnyDoc): Model {
    return {
      name: Reify.string(doc.name),
      documents: Reify.array(doc.documents),
    }
  }

  onStroke = (stroke: Stroke) => {
    console.log(stroke)
    switch (stroke.glyph) {
      case Glyph.paste:
        this.props.emit({ type: "ShelfContentsRequested" })
    }
  }

  render() {
    switch (this.props.mode) {
      case "fullscreen":
        return this.renderFullscreen()
      case "embed":
        return this.renderPreview()
      case "preview":
        return this.renderPreview()
    }
  }

  renderFullscreen() {
    const { name, documents } = this.props.doc
    return (
      <StrokeRecognizer onStroke={this.onStroke}>
        <div style={style.Identity}>
          <div style={style.Profile}>
            <h2>{name || "My Name"}</h2>
          </div>
          <div style={style.Documents}>
            {documents.map(docUrl => (
              <div style={style.Item}>
                <div style={style.ItemContent}>
                  <Content mode="embed" url={docUrl} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </StrokeRecognizer>
    )
  }

  renderPreview() {
    const { name } = this.props.doc
    return (
      <div style={style.Identity}>
        <h2>{name || "My Name"}</h2>
      </div>
    )
  }
}

const style = {
  Identity: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
  },
  Profile: {
    borderBottom: "1px solid #aaa",
    padding: 20,
  },
  Documents: {
    flexGrow: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gridAutoRows: "1fr",
    gridGap: "10px",
    width: "100%",
    padding: 30,
    backgroundColor: "#aaa",
  },
  Item: {
    position: "relative",
    overflow: "hidden",
    height: 200,
  },
  ItemContent: {
    background: "#fff",
    overflow: "hidden",
    maxHeight: "100%'",
  },
}

export default Widget.create(
  "Identity",
  Identity,
  Identity.reify,
  IdentityActor,
)
