import * as React from "react"
import Content from "./Content"
const anonymousIcon = require("../assets/anonymous.svg")

interface Props {
  avatarUrl: string
  name: string
  isEditing?: boolean
  onChange?: (e: React.FormEvent) => void
}

export default class IdentityBadge extends React.Component<Props> {
  inputEl: HTMLInputElement | null

  componentDidMount() {
    if (this.inputEl && this.props.isEditing) {
      this.inputEl.focus()
    }
  }

  componentDidUpdate(prevProps: Props) {
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
    flexShrink: 0,
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
  // Match `Image.tsx` style
  AnonymousImage: {
    objectFit: "cover" as "cover",
    pointerEvents: "none" as "none",
    display: "block",
    maxHeight: "100%",
    maxWidth: "100%",
    height: "100%",
  },
}
