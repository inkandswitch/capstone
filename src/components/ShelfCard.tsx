import * as Preact from "preact"
import Content from "./Content"

interface Props {
  url: string
  index: number
}

export default class ShelfCard extends Preact.Component<Props> {
  render() {
    const { url, index } = this.props

    const x = Math.sin(index * Math.E) * 40 + 135
    const y = Math.cos(index * Math.E) * 40 + 175

    return (
      <div
        style={{
          ...style.ShelfCard,
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(0.5) `,
        }}>
        <Content mode="preview" url={url} />
      </div>
    )
  }
}

const style = {
  ShelfCard: {
    maxWidth: 200,
    minWidth: 150,
    maxHeight: 200,
    position: "absolute",
    backgroundColor: "#fff",
    overflow: "hidden",
    boxShadow: "0 0 30px rgba(0,0,0,0.3)",
  },
}
