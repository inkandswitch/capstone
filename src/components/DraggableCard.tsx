import * as React from "react"

export interface Props {
  image?: string
  text?: string
}

export default class DraggableCard extends React.PureComponent<Props> {
  render() {
    const { image, text } = this.props

    return (
      <div className="Card" style={style.card}>
        {image ? <img src={image} style={style.image} /> : text}
      </div>
    )
  }
}

const style: { [name: string]: React.CSSProperties } = {
  card: {
    height: 90,
    width: 150,
    padding: 12,
    fontSize: 11,
    lineHeight: 1.4,
    position: "absolute",
    backgroundColor: "white",
    border: "1px solid #f0f0f0",
    borderRadius: 6,
    boxShadow: "0px 6px 12px -8px rgba(0,0,0,0.1)",
  },
  image: {
    height: "90%",
    pointerEvents: "none",
  },
}
