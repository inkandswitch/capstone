import * as React from "react"
import Draggable from "react-draggable"
import * as Types from "../types"
import Card from "./Card"

export interface Props {
  card: Types.Card
  onDragStart: (card: Types.Card) => void
}

export default class DraggableCard extends React.PureComponent<Props> {
  render() {
    const { card } = this.props

    return (
      <Draggable
        key={card.id}
        defaultPosition={{ x: card.x, y: card.y }}
        onStart={() => this.props.onDragStart(card)}>
        <div style={{ position: "absolute", willChange: "transform" }}>
          <Card text={card.text} image={card.image} />
        </div>
      </Draggable>
    )
  }
}
