import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { clamp, isEmpty, size } from "lodash"
import * as Widget from "./Widget"
import DraggableCard, { CardModel } from "./DraggableCard"
import Content, {
  DocumentActor,
  Message,
  ReceiveDocuments,
  DocumentCreated,
} from "./Content"
import * as Reify from "../data/Reify"
import * as UUID from "../data/UUID"
import { Glyph } from "../data/Glyph"
import VirtualKeyboard from "./VirtualKeyboard"
import Ink from "./Ink"
import { EditDoc, AnyDoc } from "automerge/frontend"
import { CARD_WIDTH } from "./Card"
import * as Position from "../logic/Position"
import StrokeRecognizer, {
  StrokeSettings,
  InkStrokeEvent,
  GlyphEvent,
} from "./StrokeRecognizer"
import { AddToShelf, ShelfContents, ShelfContentsRequested } from "./Shelf"
import * as Feedback from "./CommandFeedback"
import * as cardCss from "./css/Card.css"

const boardIcon = require("../assets/board_icon.svg")

const BOARD_PADDING = 15

export interface CanvasStroke {
  settings: StrokeSettings
  path: string
}

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: CanvasStroke[]
  topZ: number
}

interface CardMatch {
  card: CardModel
  center: Point
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  onNavigate?: (url: string) => void
}

interface State {
  focusedCardId: string | null
}

export interface CreateCard extends Message {
  type: "CreateCard"
  body: {
    type: string
    card: {
      id: string
      x: number
      y: number
    }
  }
}

type WidgetMessage = CreateCard | ShelfContentsRequested | AddToShelf
type InMessage = WidgetMessage | ShelfContents | ReceiveDocuments
type OutMessage = DocumentCreated | AddToShelf | ShelfContentsRequested

export class BoardActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        const { urls } = message.body
        this.change(doc => {
          urls.forEach((url: string) => addCard(doc, url))
        })
        break
      }
      case "CreateCard": {
        const { type, card } = message.body
        // TODO: async creation - should we split this across multiple messages?
        const url = await this.create(type)
        this.change(doc => {
          const z = ++doc.topZ
          doc.cards[card.id] = { ...card, z, url }
          return doc
        })
        this.emit({ type: "DocumentCreated", body: url })
        break
      }
      case "AddToShelf": {
        this.emit({ type: "AddToShelf", body: message.body })
        break
      }
      case "ShelfContentsRequested": {
        this.emit({ type: "ShelfContentsRequested", body: message.body })
        break
      }
      case "ShelfContents": {
        const { urls, placementPosition } = message.body
        this.change(doc => {
          urls.forEach((url, index) =>
            addCard(doc, url, Position.radial(index, placementPosition)),
          )
          return doc
        })
        break
      }
    }
  }
}

function addCard(
  board: EditDoc<Model>,
  url: string,
  position?: { x: number; y: number },
) {
  position = position || { x: 0, y: 0 }
  const card = {
    id: UUID.create(),
    z: board.topZ++,
    x: position.x,
    y: position.y,
    url,
  }
  board.cards[card.id] = card
  return board
}

class Board extends React.Component<Props, State> {
  boardEl?: HTMLDivElement
  state = { focusedCardId: null }

  static reify(doc: AnyDoc): Model {
    return {
      cards: Reify.map(doc.cards),
      strokes: Reify.array(doc.strokes),
      topZ: Reify.number(doc.topZ),
    }
  }

  onRef = (ref: HTMLDivElement) => {
    this.boardEl = ref
  }

  render() {
    const { cards, topZ, strokes } = this.props.doc
    const { focusedCardId } = this.state
    switch (this.props.mode) {
      case "fullscreen":
        return (
          <StrokeRecognizer
            onGlyph={this.onGlyph}
            onInkStroke={this.onInkStroke}>
            <div style={style.Board} ref={this.onRef}>
              <VirtualKeyboard onClose={this.onVirtualKeyboardClose} />
              <TransitionGroup>
                {Object.values(cards).map(card => {
                  if (!card) return null

                  return (
                    <CSSTransition
                      key={card.id}
                      classNames="Card"
                      enter={false}
                      timeout={{ exit: 1 }}>
                      <DraggableCard
                        card={card}
                        onDoubleTap={this.props.onNavigate}
                        onDragStart={this.onDragStart}
                        onDragStop={this.onDragStop}>
                        <Content
                          mode="embed"
                          url={card.url}
                          isFocused={focusedCardId === card.id}
                        />
                      </DraggableCard>
                    </CSSTransition>
                  )
                })}
              </TransitionGroup>
              <Ink strokes={strokes} />
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
          </StrokeRecognizer>
        )
      case "embed":
      case "preview":
        return (
          <div style={style.Preview.Board}>
            <img style={style.Preview.Icon} src={boardIcon} />
            <div style={style.Preview.TitleContainer}>
              <div style={style.Preview.Title}>Board</div>
              <div style={style.Preview.SubTitle}>
                {isEmpty(cards) ? "No" : size(cards)} items
              </div>
            </div>
          </div>
        )
    }
  }

  onVirtualKeyboardClose = () => {
    this.clearCardFocus()
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

  onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    this.clearCardFocus()
  }

  setCardFocus = (cardId: string) => {
    this.setState({ focusedCardId: cardId })
  }

  clearCardFocus = () => {
    this.setState({ focusedCardId: null })
  }

  deleteCard = (id: string) => {
    this.props.change(doc => {
      delete doc.cards[id]
      return doc
    })
    this.clearCardFocus()
  }

  onGlyph = (stroke: GlyphEvent) => {
    let glyphHandled = false
    // Attempt card glyph
    const cardMatch = this.cardMatchAtPoint(stroke.center.x, stroke.center.y)
    if (cardMatch) {
      glyphHandled = this.onCardGlyph(stroke, cardMatch)
    }
    // If not handled, attempt board glyph
    if (!glyphHandled) {
      glyphHandled = this.onBoardGlyph(stroke)
    }
    // If still not handled, we don't recognize the gesture
    if (!glyphHandled) {
      Feedback.Provider.add("Unrecognized gesture", stroke.center)
    }
  }

  onBoardGlyph = (stroke: GlyphEvent): boolean => {
    switch (stroke.glyph) {
      case Glyph.paste:
        Feedback.Provider.add("Place contents of shelf", stroke.center)
        this.props.emit({
          type: "ShelfContentsRequested",
          body: {
            placementPosition: {
              x: stroke.center.x - CARD_WIDTH / 2,
              y: stroke.bounds.top,
            },
          },
        })
        break
      case Glyph.create:
        Feedback.Provider.add("Create board", stroke.center)
        this.createCard("Board", stroke.center.x, stroke.center.y)
        break
      default: {
        return false
      }
    }
    return true
  }

  onCardGlyph = (event: GlyphEvent, cardMatch: CardMatch): boolean => {
    switch (event.glyph) {
      case Glyph.paste: {
        Feedback.Provider.add("Place contents of shelf", cardMatch.center)
        this.props.emit({
          type: "ShelfContentsRequested",
          body: { recipientUrl: cardMatch.card.url },
        })
        break
      }
      case Glyph.delete:
        this.deleteCard(cardMatch.card.id)
        Feedback.Provider.add("Delete", cardMatch.center)
        break
      case Glyph.copy: {
        this.props.emit({
          type: "AddToShelf",
          body: { url: cardMatch.card.url },
        })
        Feedback.Provider.add("Add to shelf", cardMatch.center)
        break
      }
      case Glyph.edit: {
        if (this.state.focusedCardId != null) return false

        // move card to top of stack
        const cardId = cardMatch.card.id
        this.props.change(doc => {
          const card = doc.cards[cardId]
          if (!card) return doc
          doc.topZ++
          doc.cards[card.id] = { ...card, z: doc.topZ }
          return doc
        })
        this.setCardFocus(cardId)
        Feedback.Provider.add("Edit", cardMatch.center)
        break
      }
      default: {
        // Return false if the glyph wasn't handled
        return false
      }
    }
    // Return true if the glyph was handled
    return true
  }

  cardMatchAtPoint = (x: number, y: number): CardMatch | undefined => {
    if (isNaN(x) || isNaN(y)) {
      return undefined
    }
    const el = document.elementFromPoint(x, y)
    const cardEl = el.closest(`.${cardCss.Card}`)
    if (!cardEl || !cardEl.id) return
    const card = this.props.doc.cards[cardEl.id]
    const cardRect = cardEl.getBoundingClientRect()
    const center = {
      x: cardRect.left + cardRect.width / 2,
      y: cardRect.top + cardRect.height / 2,
    }
    return card && { card, center }
  }

  onInkStroke = (stroke: InkStrokeEvent) => {
    this.props.change(doc => {
      doc.strokes.push({
        settings: stroke.settings,
        path:
          "M " +
          stroke.points.map(point => `${point.X} ${point.Y}`).join(" L "),
      })
      return doc
    })
  }

  async createCard(type: string, x: number, y: number, focus: boolean = false) {
    if (this.props.doc.focusedCardId != null) return
    if (!this.boardEl) return

    const id = UUID.create()
    const maxX = this.boardEl.clientWidth - CARD_WIDTH - 2 * BOARD_PADDING
    const maxY = this.boardEl.clientHeight - 2 * BOARD_PADDING
    const cardX = clamp(x - CARD_WIDTH / 2, 0, maxX)
    const cardY = clamp(y, 0, maxY)

    this.props.emit({
      type: "CreateCard",
      body: {
        type: type,
        card: { id, x: cardX, y: cardY },
      },
    })
    if (focus) {
      this.setCardFocus(id)
    }
  }
}

const style = {
  Board: {
    width: "100%",
    height: "100%",
    padding: BOARD_PADDING,
    position: "absolute" as "absolute",
    zIndex: 0,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  FocusBackgroundOverlay: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    position: "absolute" as "absolute",
    backgroundColor: "#000",
    opacity: 0.15,
  },

  Preview: {
    Board: {
      display: "flex" as "flex",
      flexDirection: "row" as "row",
      justifyContent: "center",
      padding: "50px 25px",
      fontSize: 16,
      backgroundColor: "#fff",
    },
    Icon: {
      height: 50,
      width: 50,
    },
    TitleContainer: {
      display: "flex" as "flex",
      flexDirection: "column" as "column",
      justifyContent: "center",
      margin: "0 15px",
    },
    Title: {
      fontSize: 24,
      fontWeight: 500,
      lineHeight: "1.2em",
    },
    SubTitle: {
      fontSize: "smaller",
    },
  },
}

export default Widget.create("Board", Board, Board.reify, BoardActor)
