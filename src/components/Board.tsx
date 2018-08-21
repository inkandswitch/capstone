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
  locallyFocusedCardURL?: string
}

export default class Board extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      cards: Reify.array(doc.cards),
      topZ: Reify.number(doc.topZ),
      locallyFocusedCardURL: undefined,
    }
  }

  show({ cards, topZ, locallyFocusedCardURL }: Model) {
    if (!cards) {
      return null
    }
    return (
      <div style={style.Board} onDblClick={this.onDblClick}>
        {cards.map((card, idx) => {
          return (
            <DraggableCard
              key={idx}
              index={idx}
              card={card}
              onDragStart={this.dragStart}>
              <Content
                mode="embed"
                url={card.url}
                isFocused={card.url === locallyFocusedCardURL}
              />
            </DraggableCard>
          )
        })}
      </div>
    )
  }

  onDblClick = ({ x, y }: MouseEvent) => {
    Content.create("Text").then(url => {
      this.change(doc => {
        const z = doc.topZ++
        doc.cards.push({ x, y, z, url })
        doc.locallyFocusedCardURL = url
        return doc
      })
    })
  }

  // onDblClick(e: PointerEvent) {
  //   switch (e.pointerType) {
  //     case "mouse":
  //       console.log("mouse")
  //       break
  //     case "pen":
  //       console.log("pen")
  //       break
  //     case "touch":
  //       console.log("touch")
  //       break
  //   }
  // console.log(e.pointerType)
  // console.log("pointer up " + e.clientX)
  // let url = Content.create("Text")
  // let doc = Content.open(url)
  // this.doc.change()

  // console.log(url)
  // }

  dragStart = (idx: number) => {
    this.change(doc => {
      doc.topZ += 1
      doc.cards[idx] && (doc.cards[idx].z = doc.topZ)
      return doc
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
    backgroundColor: "#fff",
  },
}
