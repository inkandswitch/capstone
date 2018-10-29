import * as React from "react"
import { AnyDoc } from "automerge/frontend"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import Content from "./Content"
import * as Widget from "./Widget"
import IdentityBadge from "./IdentityBadge"

export interface Model {
  name: string
  avatarUrl: string
  mailboxUrl: string
}

interface Props extends Widget.Props<Model> {
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

  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target

    this.props.change(doc => {
      doc.name = value
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
    const { name, avatarUrl } = this.props.doc
    const { isEditing } = this.state
    return (
      <div style={style.Identity} onPointerDown={this.onPointerDown}>
        <div style={style.Profile} onPointerDown={this.onBadgePointerDown}>
          <IdentityBadge
            name={name}
            avatarUrl={avatarUrl}
            isEditing={isEditing}
            onChange={this.onChange}
          />
          <div style={style.PeerStatus}>
            <Content
              mode="embed"
              url={Link.setType(this.props.url, "PeerStatus")}
            />
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
          <Content
            mode="embed"
            url={Link.setType(this.props.url, "PeerStatus")}
          />
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

export default Widget.create("Identity", Identity, Identity.reify)
