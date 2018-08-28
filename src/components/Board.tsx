import * as Preact from "preact"
import Widget from "./Widget"
import Pen, { PenEvent } from "./Pen"
import DraggableCard from "./DraggableCard"
import VirtualKeyboard, {
  ensureVirtualKeyboardOpensOnNextFocus,
} from "./VirtualKeyboard"
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
  isFocused?: boolean
}

export interface Model {
  cards: CardModel[]
  topZ: number
  locallyFocusedCardIndex?: number
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
      locallyFocusedCardIndex: undefined,
    }
  }

  onVirtualKeyboardClose = () => {
    this.change(doc => {
      return this.clearCardFocus(doc)
    })
  }

  show({ cards, topZ, locallyFocusedCardIndex }: Model) {
    if (!cards) {
      return null
    }
    return (
      <VirtualKeyboard onClose={this.onVirtualKeyboardClose}>
        <Pen onDoubleTap={this.onPenDoubleTapBoard}>
          <div
            onDblClick={this.onDblClick}
            style={style.Board}
            ref={(el: HTMLElement) => (this.boardEl = el)}>
            {cards.map((card, idx) => {
              return (
                <DraggableCard
                  key={idx}
                  index={idx}
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
            {locallyFocusedCardIndex !== undefined && (
              <div
                style={{ ...style.FocusBackgroundOverlay, zIndex: topZ - 1 }}
                onPointerDown={this.onPointerDownOverlay}
              />
            )}
          </div>
        </Pen>
      </VirtualKeyboard>
    )
  }

  onDblClick = (e: Event) => {
    if (this.state.doc && this.state.doc.locallyFocusedCardIndex) return
    ensureVirtualKeyboardOpensOnNextFocus()
  }

  onPenDoubleTapBoard = (e: PenEvent) => {
    if (
      !this.state.doc ||
      this.state.doc.locallyFocusedCardIndex !== undefined ||
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

    ensureVirtualKeyboardOpensOnNextFocus()

    Content.create("Text").then(url => {
      this.change(doc => {
        const z = (doc.topZ += 1)
        doc.cards.push({ x: cardX, y: cardY, z, url })
        return this.setCardFocus(doc, doc.cards.length - 1)
      })
    })
  }

  onDragStart = (idx: number) => {
    this.change(doc => {
      const card = doc.cards[idx]
      if (!card) return doc
      if (card.z === doc.topZ) return doc

      doc.topZ += 1
      // XXX: Remove once backend/store handles object immutability.
      doc.cards[idx] = { ...card, z: doc.topZ }
      return doc
    })
  }

  onDragStop = (x: number, y: number, idx: number) => {
    this.change(doc => {
      const card = doc.cards[idx]
      if (card) {
        // TODO: Remove once backend/store handles object immutability.
        doc.cards[idx] = { ...card, x: x, y: y }
      }
      return doc
    })
  }

  onPointerDownOverlay = (e: PointerEvent) => {
    // Prevent taps on the overlay from closing the keyboard/losing input focus.
    e.preventDefault()
    e.stopPropagation()
  }

  onTapCard = (index: number) => {
    if (!this.state.doc || this.state.doc.locallyFocusedCardIndex !== undefined)
      return
    //ensureVirtualKeyboardOpensOnNextFocus()
    this.change(doc => {
      return this.setCardFocus(doc, index)
    })
  }

  setCardFocus = (doc: Doc<Model>, cardIndex: number): Doc<Model> => {
    const card = doc.cards[cardIndex]
    doc.cards[cardIndex] = { ...card, isFocused: true }
    doc.locallyFocusedCardIndex = cardIndex
    return doc
  }

  clearCardFocus = (doc: Doc<Model>): Doc<Model> => {
    if (doc.locallyFocusedCardIndex === undefined) return doc
    const card = doc.cards[doc.locallyFocusedCardIndex]
    doc.cards[doc.locallyFocusedCardIndex] = { ...card, isFocused: false }
    doc.locallyFocusedCardIndex = undefined
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
