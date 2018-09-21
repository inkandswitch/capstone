import * as Preact from "preact"
import Content, { DocumentActor } from "./Content"
import { ShelfContents, ShelfContentsRequested } from "./Shelf"
import StrokeRecognizer, { GlyphEvent, Glyph } from "./StrokeRecognizer"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import * as Widget from "./Widget"
import { AnyDoc } from "automerge/frontend"
const anonymousIcon = require("../assets/anonymous.svg")

interface Model {
  name: string
  avatarUrl: string
  documents: string[]
}

type WidgetMessage = ShelfContentsRequested
type InMessage = WidgetMessage | ShelfContents
type OutMessage = ShelfContentsRequested

export class IdentityActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ShelfContentsRequested": {
        this.emit({ type: "ShelfContentsRequested", body: message.body })
        break
      }
      case "ShelfContents": {
        const { urls, intent } = message.body
        if (!urls.length) return

        this.change(doc => {
          if (intent === "avatar") {
            // Only change avatar if there is a single document on the shelf and it is
            // an image.
            // TODO: Feedback if this fails
            const { type } = Link.parse(urls[0])
            if (urls.length === 1 && type === "Image") {
              doc.avatarUrl = urls[0]
            }
          } else {
            doc.documents = doc.documents.concat(urls)
          }
          return doc
        })
        break
      }
    }
  }
}

interface Props extends Widget.Props<Model, WidgetMessage> {}
interface State {
  isEditing: boolean
}

export class Identity extends Preact.Component<Props, State> {
  state = { isEditing: false }

  static reify(doc: AnyDoc): Model {
    return {
      name: Reify.string(doc.name),
      avatarUrl: Reify.string(doc.avatarUrl),
      documents: Reify.array(doc.documents),
    }
  }

  onPointerDown = (event: PointerEvent) => {
    console.log("onTap")
    if (this.state.isEditing) this.setState({ isEditing: false })
  }

  onBadgePointerDown = (event: PointerEvent) => {
    if (this.state.isEditing) event.stopPropagation()
  }

  onBadgeGlyph = (stroke: GlyphEvent) => {
    switch (stroke.glyph) {
      case Glyph.paste:
        this.props.emit({
          type: "ShelfContentsRequested",
          body: { intent: "avatar" },
        })
        break
      case Glyph.edit:
        this.setState({ isEditing: true })
    }
  }

  onCubbyGlyph = (stroke: GlyphEvent) => {
    switch (stroke.glyph) {
      case Glyph.paste:
        this.props.emit({
          type: "ShelfContentsRequested",
          body: { intent: "cubby" },
        })
        break
    }
  }

  onChange = (event: any) => {
    console.log("CHANGE")
    this.props.change(doc => {
      doc.name = event.target.value
      return doc
    })
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
    const { name, avatarUrl, documents } = this.props.doc
    const { isEditing } = this.state
    return (
      <div style={style.Identity} onPointerDown={this.onPointerDown}>
        <StrokeRecognizer onGlyph={this.onBadgeGlyph}>
          <div style={style.Profile} onPointerDown={this.onBadgePointerDown}>
            <IdentityBadge
              name={name}
              avatarUrl={avatarUrl}
              isEditing={isEditing}
              onChange={this.onChange}
            />
          </div>
        </StrokeRecognizer>
        <StrokeRecognizer onGlyph={this.onCubbyGlyph}>
          <div style={style.Documents}>
            {documents.map(docUrl => (
              <div style={style.Item}>
                <div style={style.ItemContent}>
                  <Content mode="embed" url={docUrl} />
                </div>
              </div>
            ))}
          </div>
        </StrokeRecognizer>
      </div>
    )
  }

  renderPreview() {
    const { name, avatarUrl } = this.props.doc
    return (
      <div style={style.preview.Identity}>
        <IdentityBadge avatarUrl={avatarUrl} name={name} />
      </div>
    )
  }
}

interface IdentityBadgeProps {
  avatarUrl: string
  name: string
  isEditing?: boolean
  onChange?: (e: Event) => void
}

class IdentityBadge extends Preact.Component<IdentityBadgeProps> {
  inputEl?: HTMLElement

  componentDidMount() {
    if (this.inputEl && this.props.isEditing) {
      this.inputEl.focus()
    }
  }

  componentDidUpdate(prevProps: IdentityBadgeProps) {
    if (this.inputEl && this.props.isEditing && !prevProps.isEditing) {
      this.inputEl.focus()
    }
  }

  render() {
    const {
      avatarUrl,
      name,
      isEditing = false,
      onChange = () => {},
    } = this.props
    return (
      <div style={style.IdentityBadge}>
        <div style={style.IdentityBadgeAvatar}>
          {avatarUrl ? (
            <Content mode="embed" url={avatarUrl} />
          ) : (
            <img src={anonymousIcon} style={style.AnonymousImage} />
          )}
        </div>
        <div style={style.IdentityBadgeName}>
          <input
            ref={el => (this.inputEl = el)}
            readOnly={!isEditing}
            style={style.NameInput}
            onInput={onChange}
            value={name}
            placeholder={"Anonymous"}
          />
        </div>
      </div>
    )
  }
}

const style = {
  preview: {
    Identity: {},
  },
  Identity: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    padding: 50,
    alignItems: "center",
  },
  Profile: {
    border: "1px solid #aaa",
    marginBottom: 25,
    height: 100,
  },
  IdentityBadge: {
    padding: 10,
    display: "inline-flex",
    height: "100%",
    alignItems: "center",
  },
  IdentityBadgeAvatar: {
    border: "3px solid #333",
    borderRadius: 999,
    overflow: "hidden",
    height: "100%",
  },
  IdentityBadgeName: {
    marginLeft: 10,
  },
  NameInput: {
    fontWeight: 700,
    fontSize: "larger",
    border: 0,
    margin: 0,
    padding: 0,
    outline: 0,
  },
  Documents: {
    flexGrow: 1,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gridAutoRows: "1fr",
    gridGap: "10px",
    width: "75vw",
    padding: 30,
    backgroundColor: "#e5e5e5",
    border: "1px solid #aaa",
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
  // Match `Image.tsx` style
  AnonymousImage: {
    objectFit: "cover",
    pointerEvents: "none",
    display: "block",
    maxWidth: "100%",
    maxHeight: "100%",
    height: "100%",
  },
}

export default Widget.create(
  "Identity",
  Identity,
  Identity.reify,
  IdentityActor,
)
