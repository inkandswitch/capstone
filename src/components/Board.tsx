import * as Preact from "preact"
import Card from "./Card"
import Widget from "./Widget"
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

export default class Board extends Widget<Model> {
  defaults(): Model {
    return {
      cards: {},
      topZ: 0,
    }
  }

  show({ cards, topZ }: Model) {
    return (
      <div style={style.Board} className="Board">
        <div style={style.Page}>
          {Object.values(cards).map(card => {
            return (
              <DraggableCard
                key={card.id}
                card={card}
                onDragStart={this.dragStart}
              />
            )
          })}
        </div>
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
  Board: {
    width: "100%",
    height: "100%",
    position: "absolute",
    zIndex: 0,
    backgroundColor: "#eee",
  },
  Page: {
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 10,
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}
