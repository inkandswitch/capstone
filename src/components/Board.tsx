import * as React from "react"
import Draggable from "react-draggable"
import * as Types from "../types"
import Card from "./Card"
import DraggableCard from "./DraggableCard"

interface BoardProps {
  cards: { [s: string]: Types.Card }
  liftBoardCardZ: (card: Types.Card) => void
}

export default class Board extends React.PureComponent<BoardProps, any> {
  constructor(props: BoardProps) {
    super(props)
    const numberOfCards = Object.keys(props.cards).length
    this.state = { highestZ: numberOfCards }
  }

  render() {
    return (
      <div style={boardStyle} className="Board">
        {Object.keys(this.props.cards).map(id => {
          const card = this.props.cards[id]

          if (!card.onBoard) {
            return null
          }

          return (
            <DraggableCard
              key={card.id}
              card={card}
              onDragStart={this.props.liftBoardCardZ}
            />
          )
        })}
      </div>
    )
  }
}

const boardStyle: React.CSSProperties = {
  width: 800,
  height: 400,
  position: "absolute",
  zIndex: 0,
}
