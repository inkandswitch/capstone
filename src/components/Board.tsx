import * as Preact from "preact"
import Widget from "./Widget"
import DraggableCard from "./DraggableCard"
import Content from "./Content"
import * as Reify from "../data/Reify"
import { AnyDoc, Doc } from "automerge"
import { CARD_HEIGHT, CARD_WIDTH } from "./Card"
import { clamp } from "lodash"

const BOARD_PADDING = 15

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

interface Props {
  onNavigate?: (url: string) => void
}

export default class Board extends Widget<Model, Props> {
  boardEl?: HTMLElement

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
      <div
        style={style.Board}
        onDblClick={this.onDblClick}
        ref={(el: HTMLElement) => (this.boardEl = el)}>
        {cards.map((card, idx) => {
          return (
            <DraggableCard
              key={idx}
              index={idx}
              card={card}
              onPinchEnd={this.props.onNavigate}
              onDragStart={this.onDragStart}>
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
    if (!this.boardEl) return
    const cardX = clamp(
      x - CARD_WIDTH / 2,
      0,
      this.boardEl.scrollWidth - CARD_WIDTH - 2 * BOARD_PADDING,
    )
    const cardY = clamp(
      y - CARD_HEIGHT / 2,
      0,
      this.boardEl.scrollHeight - CARD_HEIGHT - 2 * BOARD_PADDING,
    )

    Content.create("Text").then(url => {
      this.change(doc => {
        const z = doc.topZ++
        doc.cards.push({ x: cardX, y: cardY, z, url })
        doc.locallyFocusedCardURL = url
        return doc
      })
    })
  }

  onDragStart = (idx: number) => {
    this.change(doc => {
      doc.topZ += 1
      const card = doc.cards[idx]
      if (card) {
        // XXX: Remove once backend/store handles object immutability.
        doc.cards[idx] = { ...card, z: doc.topZ }
      }
      return doc
    })
  }
}

Content.register("Board", Board)

const style = {
  Board: {
    width: "100%",
    height: "100%",
    padding: BOARD_PADDING,
    position: "absolute",
    zIndex: 0,
    backgroundColor: "#fff",
  },
}
