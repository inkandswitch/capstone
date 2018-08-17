import * as Preact from "preact"
import Widget from "./Widget"
import DraggableCard from "./DraggableCard"
import Content from "./Content"
import * as Reify from "../data/Reify"
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
      cards: Reify.array(doc.cards),
      topZ: Reify.number(doc.topZ),
    }
  }

  show({ cards, topZ }: Model) {
    switch (this.mode) {
      case "fullscreen":
        return (
          <div style={style.Board}>
            <div
              style={style.Page}
              onDragOver={this.dragOver}
              onDrop={this.drop}>
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

      case "embed":
      case "preview":
        return (
          <div style={style.Preview.Board}>
            <div style={style.Preview.Title}>Untitled Board</div>
            <div style={style.Preview.SubTitle}>{cards.length} cards</div>
          </div>
        )
    }
  }

  dragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes("application/capstone-url")) return

    event.preventDefault()
  }

  drop = (event: DragEvent) => {
    const url = event.dataTransfer.getData("application/capstone-url")
    event.preventDefault()

    this.change(doc => {
      doc.cards.push({
        url,
        x: event.x,
        y: event.y,
        z: ++doc.topZ,
      })
    })
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
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  Preview: {
    Board: {
      padding: 10,
      fontSize: 16,
      textAlign: "center",
      backgroundColor: "#fff",
    },
    Title: {
      fontSize: 20,
      color: "#333",
    },
    SubTitle: {
      color: "#666",
    },
  },
}
