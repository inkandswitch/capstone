import * as Preact from "preact"
import createWidget, { WidgetProps } from "./Widget"
import Pen, { PenEvent } from "./Pen"
import DraggableCard from "./DraggableCard"
import Content from "./Content"
import * as Reify from "../data/Reify"
import * as UUID from "../data/UUID"
import VirtualKeyboard from "./VirtualKeyboard"
import { AnyDoc, Doc } from "automerge"
import { CARD_WIDTH } from "./Card"
import { clamp } from "lodash"
import StrokeRecognizer, { Stroke } from "./StrokeRecognizer"

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
  cards: { [id: string]: CardModel | undefined }
  topZ: number
  focusedCardId: string | null
}

interface Props extends WidgetProps<Model> {
  onNavigate?: (url: string) => void
}

class Board extends Preact.Component<Props> {
  boardEl?: HTMLElement

  static reify(doc: AnyDoc): Model {
    return {
      cards: Reify.map(doc.cards),
      topZ: Reify.number(doc.topZ),
      focusedCardId: null,
    }
  }

  render() {
    const { cards, topZ, focusedCardId } = this.props.doc
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <StrokeRecognizer onStroke={this.onStroke} only={["box"]}>
            <Pen onDoubleTap={this.onPenDoubleTapBoard}>
              <div
                style={style.Board}
                ref={(el: HTMLElement) => (this.boardEl = el)}>
                <VirtualKeyboard onClose={this.onVirtualKeyboardClose} />

                {Object.values(cards).map(card => {
                  if (!card) return null

                  return (
                    <DraggableCard
                      key={card.id}
                      card={card}
                      onDelete={this.deleteCard}
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
                    style={{
                      ...style.FocusBackgroundOverlay,
                      zIndex: topZ - 1,
                    }}
                    onPointerDown={this.onPointerDown}
                  />
                ) : null}
              </div>
            </Pen>
          </StrokeRecognizer>
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

  onVirtualKeyboardClose = () => {
    if (!this.props.doc || this.props.doc.focusedCardId == null) return

    this.props.change(doc => {
      return this.clearCardFocus(doc)
    })
  }

  onPenDoubleTapBoard = (e: PenEvent) => {
    const { x, y } = e.center

    this.createCard("Text", x, y)
  }

  onDragStart = (id: string) => {
    this.props.change(doc => {
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
    this.props.change(doc => {
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
    this.props.change(doc => {
      if (doc.focusedCardId == null) return doc
      return this.clearCardFocus(doc)
    })
  }

  onTapCard = (id: string) => {
    if (!this.props.doc || this.props.doc.focusedCardId != null) return
    this.props.change(doc => {
      return this.setCardFocus(doc, id)
    })
  }

  setCardFocus = (doc: Doc<Model>, cardId: string): Doc<Model> => {
    const card = doc.cards[cardId]
    if (!card) return doc
    doc.cards[cardId] = { ...card, isFocused: true }
    doc.focusedCardId = cardId
    return doc
  }

  clearCardFocus = (doc: Doc<Model>): Doc<Model> => {
    if (doc.focusedCardId == null) return doc
    const card = doc.cards[doc.focusedCardId]
    if (card) {
      doc.cards[doc.focusedCardId] = { ...card, isFocused: false }
    }
    doc.focusedCardId = null
    return doc
  }

  deleteCard = (id: string) => {
    this.props.change(doc => {
      delete doc.cards[id]
      return this.clearCardFocus(doc)
    })
  }

  onStroke = (stroke: Stroke) => {
    switch (stroke.name) {
      case "box":
        this.createCard("Text", stroke.center.x, stroke.bounds.top)
    }
  }

  async createCard(type: string, x: number, y: number) {
    if (!this.props.doc || this.props.doc.focusedCardId != null) return
    if (!this.boardEl) return

    const maxX = this.boardEl.clientWidth - CARD_WIDTH - 2 * BOARD_PADDING
    const maxY = this.boardEl.clientHeight - 2 * BOARD_PADDING
    const cardX = clamp(x - CARD_WIDTH / 2, 0, maxX)
    const cardY = clamp(y, 0, maxY)

    const url = await Content.create(type)
    this.props.change(doc => {
      const id = UUID.create()
      const z = ++doc.topZ
      doc.cards[id] = { id, x: cardX, y: cardY, z, url }
      return this.setCardFocus(doc, id)
    })
  }
}

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

export default createWidget("Board", Board, Board.reify)
