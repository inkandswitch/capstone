import * as Preact from "preact"
import Widget from "./Widget"
import DraggableCard from "./DraggableCard"
import Content from "./Content"
import { AnyDoc, Doc } from "automerge"

interface CardModel {
  x: number
  y: number
  z: number
  url: string
}

export interface Model {
  cards: CardModel[]
  topZ: number
}

export default class Board extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      cards: Content.array(doc.cards),
      topZ: Content.number(doc.topZ, 0),
    }
  }

  show({ cards, topZ }: Model) {
    return (
      <div style={style.Board}>
        <div style={style.Page}>
          {cards.map((card, idx) => {
            return (
              <DraggableCard
                key={idx}
                index={idx}
                card={card}
                onDragStart={this.dragStart}>
                <Content mode="embed" url={card.url} />
              </DraggableCard>
            )
          })}
        </div>
      </div>
    )
  }

  dragStart = (idx: number) => {
    this.change(doc => {
      doc.topZ += 1
      doc.cards[idx] && (doc.cards[idx].z = doc.topZ)
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
