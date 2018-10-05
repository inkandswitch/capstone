import * as React from "react"
import Content from "./Content"
import * as Position from "../logic/Position"

interface Props {
  url: string
  index: number
}

export default class ShelfCard extends React.Component<Props> {
  render() {
    const { url, index } = this.props

    const { x, y } = Position.radial(
      index,
      { x: 130, y: 105 },
      Position.RADIAL_DEFAULT_MAGNITUDE / 2,
    )

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
    position: "absolute" as "absolute",
    backgroundColor: "#fff",
    overflow: "hidden",
    boxShadow: "0 0 30px rgba(0,0,0,0.3)",
  },
}
