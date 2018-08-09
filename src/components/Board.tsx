import * as Preact from "preact"
import Card from "./Card"
import Base from "./Base"
import DraggableCard from "./DraggableCard"
import Content from "./Content"

interface CardModel {
  x: number
  y: number
  z: number
  type: string
  id: string
}

export interface Model {
  cards: { [id: string]: CardModel }
  topZ: number
}

export default class Board extends Base<Model> {
  defaults(): Model {
    return {
      cards: {},
      topZ: 0,
    }
  }

  show({ cards, topZ }: Model) {
    return (
      <div style={style.board} className="Board">
        {Object.keys(cards).map(id => {
          const card = cards[id]

          return (
            <DraggableCard key={id} card={card} onDragStart={this.dragStart} />
          )
        })}
      </div>
    )
  }

  dragStart = (id: string) => {
    this.change(doc => {
      doc.topZ += 1
      doc.cards[id] && (doc.cards[id].z = doc.topZ)
    })
  }
}

Content.register("Board", Board)

const style = {
  board: {
    width: 800,
    height: 400,
    position: "absolute",
    zIndex: 0,
  },
}
