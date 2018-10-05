import * as React from "react"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import Content, { DocumentActor } from "./Content"
import { AddToShelf, ShelfContents, ShelfContentsRequested } from "./Shelf"
import { Glyph } from "../data/Glyph"
import StrokeRecognizer, { GlyphEvent } from "./StrokeRecognizer"
import * as Widget from "./Widget"
import IdentityBadge from "./IdentityBadge"

export interface Model {
  name: string
  avatarUrl: string
  mailboxUrl: string
}

type WidgetMessage = ShelfContentsRequested | AddToShelf
type InMessage = WidgetMessage | ShelfContents
type OutMessage = ShelfContentsRequested | AddToShelf

export class IdentityActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "AddToShelf": {
        this.emit({ type: "AddToShelf", body: message.body })
        break
      }
      case "ShelfContentsRequested": {
        this.emit({ type: "ShelfContentsRequested", body: message.body })
        break
      }
      case "ShelfContents": {
        const { urls, intent } = message.body
        if (!urls.length) return

        if (intent === "avatar") {
          this.change(doc => {
            // Only change avatar if there is a single document on the shelf and it is
            // an image.
            // TODO: Feedback if this fails
            const { type } = Link.parse(urls[0])
            if (urls.length === 1 && type === "Image") {
              doc.avatarUrl = urls[0]
            }
            return doc
          })
        } else {
          this.emit({
            type: "AddToShelf",
            to: this.doc.mailboxUrl,
            body: { urls },
          })
        }
        break
      }
    }
  }
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  onNavigate?: (url: string) => void
}

interface State {
  isEditing: boolean
}

export class Identity extends React.Component<Props, State> {
  state = { isEditing: false }

  static reify(doc: AnyDoc): Model {
    return {
      name: Reify.string(doc.name),
      avatarUrl: Reify.string(doc.avatarUrl),
      mailboxUrl: Reify.string(doc.mailboxUrl),
    }
  }

  onPointerDown = (event: React.PointerEvent) => {
    if (this.state.isEditing) this.setState({ isEditing: false })
  }

  onBadgePointerDown = (event: React.PointerEvent) => {
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

  onChange = (event: any) => {
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
        <div style={style.Profile} onPointerDown={this.onBadgePointerDown}>
          <StrokeRecognizer onGlyph={this.onBadgeGlyph}>
            <IdentityBadge
              name={name}
              avatarUrl={avatarUrl}
              isEditing={isEditing}
              onChange={this.onChange}
            />
          </StrokeRecognizer>
          <div style={style.PeerStatus}>
            <Content mode="embed" type="PeerStatus" url={this.props.url} />
          </div>
        </div>
      </div>
    )
  }

  renderPreview() {
    const { name, avatarUrl } = this.props.doc
    return (
      <div style={style.preview.Identity}>
        <IdentityBadge avatarUrl={avatarUrl} name={name} />
        <div style={style.PeerStatus}>
          <Content mode="embed" type="PeerStatus" url={this.props.url} />
        </div>
      </div>
    )
  }
}

const style = {
  preview: {
    Identity: {
      height: 100,
    },
  },
  Identity: {
    display: "flex" as "flex",
    flexDirection: "column" as "column",
    height: "100%",
    width: "100%",
    padding: 50,
    alignItems: "center",
  },
  Profile: {
    border: "1px solid #aaa",
    marginBottom: 25,
    position: "relative" as "relative",
  },
  PeerStatus: {
    position: "absolute" as "absolute",
    bottom: 0,
    right: 0,
  },
}

export default Widget.create(
  "Identity",
  Identity,
  Identity.reify,
  IdentityActor,
)
