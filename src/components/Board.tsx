import * as Preact from "preact"
import Widget from "./Widget"
import Pen, { PenEvent } from "./Pen"
import DraggableCard from "./DraggableCard"
import Content from "./Content"
import * as Reify from "../data/Reify"
import * as UUID from "../data/UUID"
import VirtualKeyboard from "./VirtualKeyboard"
import { AnyDoc, Doc } from "automerge"
import { CARD_HEIGHT, CARD_WIDTH } from "./Card"
import { clamp } from "lodash"

const BOARD_PADDING = 15

interface CardModel {
  id: string
  x: number
  y: number
  z: number
  url: string
  isFocused?: boolean
}

export interface Model {
  cards: { [id: string]: CardModel }
  topZ: number
  focusedCardId: string | null
}

interface Props {
  onNavigate?: (url: string) => void
}

export default class Board extends Widget<Model, Props> {
  boardEl?: HTMLElement

  static reify(doc: AnyDoc): Model {
    return {
      cards: Reify.map(doc.cards),
      topZ: Reify.number(doc.topZ),
      focusedCardId: null,
    }
  }

  show({ cards, topZ, focusedCardId }: Model) {
    return (
      <Pen onDoubleTap={this.onPenDoubleTapBoard}>
        <div style={style.Board} ref={(el: HTMLElement) => (this.boardEl = el)}>
          <VirtualKeyboard onClose={this.onVirtualKeyboardClose} />
          {Object.values(cards).map(card => {
            return (
              <DraggableCard
                key={card.id}
                card={card}
                onPinchEnd={this.props.onNavigate}
                onDragStart={this.onDragStart}
                onDragStop={this.onDragStop}
                onTap={this.onTapCard}>
                <Content
                  mode="embed"
                  url={card.url}
                  isFocused={card.isFocused}
                />
              </DraggableCard>
            )
          })}
          {focusedCardId != null ? (
            <div
              style={{ ...style.FocusBackgroundOverlay, zIndex: topZ - 1 }}
              onPointerDown={this.onPointerDown}
            />
          ) : null}
        </div>
      </Pen>
    )
  }

  onVirtualKeyboardClose = () => {
    if (!this.doc || this.doc.focusedCardId == null) return

    this.change(doc => {
      return this.clearCardFocus(doc)
    })
  }

  onPenDoubleTapBoard = (e: PenEvent) => {
    if (
      !this.state.doc ||
      this.state.doc.focusedCardId != null ||
      !this.boardEl
    )
      return

    const { x, y } = e.center
    const cardX = clamp(
      x - CARD_WIDTH / 2,
      0,
      this.boardEl.clientWidth - CARD_WIDTH - 2 * BOARD_PADDING,
    )
    const cardY = clamp(
      y - CARD_HEIGHT / 2,
      0,
      this.boardEl.clientHeight - CARD_HEIGHT - 2 * BOARD_PADDING,
    )

    Content.create("Text").then(url => {
      this.change(doc => {
        const z = (doc.topZ += 1)
        const id = UUID.create()
        doc.cards[id] = { x: cardX, y: cardY, z, url, id }
        return this.setCardFocus(doc, id)
      })
    })
  }

  onDragStart = (id: string) => {
    this.change(doc => {
      const card = doc.cards[id]
      if (!card) return doc
      if (card.z === doc.topZ) return doc

      doc.topZ += 1
      // XXX: Remove once backend/store handles object immutability.
      doc.cards[id] = { ...card, z: doc.topZ }
      return doc
    })
  }

  onDragStop = (x: number, y: number, id: string) => {
    this.change(doc => {
      const card = doc.cards[id]
      if (card) {
        // XXX: Remove once backend/store handles object immutability.
        doc.cards[id] = { ...card, x: x, y: y }
      }
      return doc
    })
  }

  onPointerDown = (e: PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    this.change(doc => {
      if (doc.focusedCardId == null) return doc
      return this.clearCardFocus(doc)
    })
  }

  onTapCard = (id: string) => {
    if (!this.state.doc || this.state.doc.focusedCardId != null) return
    this.change(doc => {
      return this.setCardFocus(doc, id)
    })
  }

  setCardFocus = (doc: Doc<Model>, cardId: string): Doc<Model> => {
    const card = doc.cards[cardId]
    doc.cards[cardId] = { ...card, isFocused: true }
    doc.focusedCardId = cardId
    return doc
  }

  clearCardFocus = (doc: Doc<Model>): Doc<Model> => {
    if (doc.focusedCardId == null) return doc
    const card = doc.cards[doc.focusedCardId]
    doc.cards[doc.focusedCardId] = { ...card, isFocused: false }
    doc.focusedCardId = null
    return doc
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
    overflow: "hidden",
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
