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
  onFullscreen?: (url: string) => void
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
        {locallyFocusedCardURL && (
          <div
            style={{ ...style.FocusBackgroundOverlay, zIndex: topZ - 1 }}
            onPointerDown={this.onPointerDown}
          />
        )}
        {cards.map((card, idx) => {
          return (
            <DraggableCard
              key={idx}
              index={idx}
              card={card}
              onPinchEnd={this.props.onFullscreen}
              onDragStart={this.onDragStart}
              onDragStop={this.onDragStop}
              onTap={this.onTapCard}>
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
    if (
      !this.state.doc ||
      this.state.doc.locallyFocusedCardURL ||
      !this.boardEl
    )
      return

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
        const z = (doc.topZ += 2)
        doc.cards.push({ x: cardX, y: cardY, z, url })
        doc.locallyFocusedCardURL = url
        return doc
      })
    })
  }

  onDragStart = (idx: number) => {
    this.change(doc => {
      doc.topZ += 2
      const card = doc.cards[idx]
      if (card) {
        // XXX: Remove once backend/store handles object immutability.
        doc.cards[idx] = { ...card, z: doc.topZ }
      }
      return doc
    })
  }

  onDragStop = (x: number, y: number, idx: number) => {
    this.change(doc => {
      const card = doc.cards[idx]
      if (card) {
        // XXX: Remove once backend/store handles object immutability.
        doc.cards[idx] = { ...card, x: x, y: y }
      }
      return doc
    })
  }

  onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    this.change(doc => {
      doc.locallyFocusedCardURL = undefined
      return doc
    })
  }

  onTapCard = (url: string) => {
    if (!this.state.doc || this.state.doc.locallyFocusedCardURL) return
    this.change(doc => {
      doc.locallyFocusedCardURL = url
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
  FocusBackgroundOverlay: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    position: "absolute",
    backgroundColor: "#000",
    opacity: 0.15,
  },
}
