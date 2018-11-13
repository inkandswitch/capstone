import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { DataImport, Link, Reify, Widget, UUID, SizeUtils } from "capstone"
import Mirrorable from "gps/Mirrorable"
import InteractableCard, { CardModel } from "./InteractableCard"
import EdgeBoardCreator from "./EdgeBoardCreator"
import Content, {
  DocumentActor,
  Message,
  ReceiveDocuments,
  DocumentCreated,
} from "capstone/Content"
import { EditDoc, AnyDoc } from "automerge/frontend"
import Ink, { InkStroke } from "./Ink"
import * as css from "./Board.css"
import * as cardCss from "./Card.css"
import Zoomable from "../Workspace/Zoomable" // HACK

const withAvailableSize = require("react-with-available-size")

// TODO: not a constant
const BOARD_DIMENSIONS = { height: 800, width: 1200 }

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: InkStroke[]
  topZ: number
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  availableSize: Size
  onNavigate?: (url: string, extraProps?: {}) => void
  scale?: number
  backNavCardTarget?: CardModel // Used to target back nav zooming.
  noInk?: boolean
  zIndex?: number
  color?: string
  zoomProgress: number
}

export interface CreateCard extends Message {
  type: "CreateCard"
  body: {
    type: string
    card: {
      id: string
      x: number
      y: number
      width: number
      height: number
    }
  }
}

type WidgetMessage = CreateCard
type InMessage = WidgetMessage | ReceiveDocuments
type OutMessage = DocumentCreated | ReceiveDocuments

export class BoardActor extends DocumentActor<Model, InMessage, OutMessage> {
  async onMessage(message: InMessage) {
    switch (message.type) {
      case "ReceiveDocuments": {
        const { urls } = message.body
        urls.forEach(async url => {
          const size = await getCardSize(url)
          const numCards = Object.keys(this.doc.cards).length || 0
          const position = calculateReceivePosition(numCards, size)
          this.change(doc => addCard(url, doc, size, position))
        })
        break
      }

      case "CreateCard": {
        const { type, card } = message.body
        const url = this.create(type)
        this.change(doc => {
          const z = ++doc.topZ
          doc.cards[card.id] = { ...card, z, url }
        })
        this.emit({ type: "DocumentCreated", body: url })
        break
      }
    }
  }
}

function calculateReceivePosition(cardCount: number, size: Size): Point {
  const pad = 20
  const left_ink_offset = 75
  const max_card_width = 200
  const cards_per_pile = 5

  const c = cardCount

  const column_width =
    Math.floor(c / cards_per_pile) * (max_card_width + pad * cards_per_pile)
  const column_start = left_ink_offset + column_width
  const stack_offset = (c % cards_per_pile) * pad

  const x = column_start + stack_offset
  const y = pad + (c % cards_per_pile) * pad

  return { x, y }
}

function getCardSize(url: string): Promise<Size> {
  const { width, height } = Link.parse(url).params

  if (width && height) {
    return Promise.resolve({ width, height })
  }

  return new Promise((resolve, reject) => {
    Content.once(url, doc => {
      SizeUtils.calculateInitialSize(url, doc).then(resolve, reject)
    })
  })
}

function addCard(
  url: string,
  board: EditDoc<Model>,
  size: Size,
  position?: Point,
) {
  const z = ++board.topZ
  position = position || { x: 0, y: 0 }
  const card = {
    id: UUID.create(),
    z: z,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    url,
  }
  board.cards[card.id] = card
}

class Board extends React.Component<Props> {
  boardEl?: HTMLDivElement

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

  onDragStart = (id: string) => {}

  onDragStop = (x: number, y: number, id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return
      card.x = x
      card.y = y
      card.z = ++doc.topZ

      if (window.hooks.onCardDragEnded) {
        console.log("HOOK!")
        window.hooks.onCardDragEnded(card)
        console.log("AFTER", card)
      }
    })
  }

  onRemoved = (id: string) => {
    this.props.change(doc => {
      delete doc.cards[id]
    })
  }

  onResizeStop = (newSize: Size, id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return

      card.width = newSize.width
      card.height = newSize.height
    })
  }

  onMirror = (id: string) => {
    const card = this.props.doc.cards[id]
    if (!card) return

    this.props.change(doc => {
      addCard(card.url, doc, card, card)
    })
  }

  onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const { clientX, clientY } = event

    DataImport.importData(event.dataTransfer).forEach(
      async (urlPromise, idx) => {
        const url = await urlPromise
        const size = await getCardSize(url)

        this.props.change(doc => {
          addCard(url, doc, size, { x: clientX, y: clientY })
        })
      },
    )
  }

  onCreateBoard = (position: Point) => {
    const url = Content.create("Board")
    this.props.change(doc => {
      addCard(url, doc, SizeUtils.CARD_DEFAULT_SIZE, position)
    })
  }

  onZoomStart = (id: string) => {
    this.props.change(doc => {
      const card = doc.cards[id]
      if (!card) return
      card.z = ++doc.topZ
    })
  }

  onDoubleTap = (id: string) => {
    const card = this.props.doc.cards[id]
    if (!card) {
      return
    }
    this.props.onNavigate &&
      this.props.onNavigate(card.url, {
        backZoomTarget: {
          size: { width: card.width, height: card.height },
          position: { x: card.x, y: card.y },
        },
      })
  }

  render() {
    const { noInk, color, zoomProgress } = this.props
    const { cards, strokes, topZ } = this.props.doc
    const frostedGlassOpacity = 0.4 * Math.max(0, 1 - zoomProgress)
    switch (this.props.mode) {
      case "fullscreen": {
        const style = color ? { backgroundColor: color } : {}

        return (
          <div
            data-container
            className={css.Board}
            id="Board"
            ref={this.onRef}
            onDragOver={this.onDragOver}
            onDrop={this.onDrop}
            style={style}>
            {noInk ? null : (
              <Ink
                onInkStroke={this.onInkStroke}
                strokes={strokes}
                mode={this.props.mode}
              />
            )}
            <TransitionGroup>
              {Object.values(cards).map(card => {
                if (!card) return null
                return (
                  <CSSTransition
                    key={card.id}
                    classNames={cardCss.Card}
                    enter={false}
                    timeout={{ exit: 1 }}>
                    <Mirrorable cardId={card.id} onMirror={this.onMirror}>
                      <InteractableCard
                        card={card}
                        onDoubleTap={this.onDoubleTap}
                        onDragStart={this.onDragStart}
                        onDragStop={this.onDragStop}
                        onRemoved={this.onRemoved}
                        onResizeStop={this.onResizeStop}>
                        <Zoomable
                          onZoomStart={this.onZoomStart}
                          id={card.id}
                          url={card.url}
                          x={card.x}
                          y={card.y}
                          width={card.width}
                          height={card.height}>
                          {zoomProgress => {
                            return (
                              <Content
                                mode="embed"
                                url={card.url}
                                zoomProgress={zoomProgress}
                              />
                            )
                          }}
                        </Zoomable>
                      </InteractableCard>
                    </Mirrorable>
                  </CSSTransition>
                )
              })}
            </TransitionGroup>

            <EdgeBoardCreator
              onBoardCreate={this.onCreateBoard}
              zIndex={topZ + 1}
            />
            {frostedGlassOpacity > 0.0 ? (
              <div
                className={css.FrostedGlass}
                style={{ opacity: frostedGlassOpacity, zIndex: 10000000 }}
              />
            ) : null}
          </div>
        )
      }
      case "embed": {
        const contentScale =
          this.props.availableSize.width / BOARD_DIMENSIONS.width
        const style = {
          transform: `scale(${contentScale})`,
          willChange: "transform",
          transformOrigin: "top left",
        }

        return (
          <div className={css.Board} ref={this.onRef} id="Board">
            <Ink
              onInkStroke={this.onInkStroke}
              strokes={strokes}
              mode={this.props.mode}
              scale={contentScale}
            />
            <div style={style}>
              {Object.values(cards).map(card => {
                if (!card) return null
                return (
                  <InteractableCard key={card.id} card={card}>
                    <Content mode="preview" url={card.url} />
                  </InteractableCard>
                )
              })}
            </div>
            <div
              className={css.FrostedGlass}
              style={{ opacity: frostedGlassOpacity }}
            />
          </div>
        )
      }
      case "preview": {
        return (
          <div>
            <div className={css.Board} id="Board" />
            <div className={css.FrostedGlass} />
          </div>
        )
      }
    }
  }

  onInkStroke = (stroke: InkStroke) => {
    this.props.change(doc => {
      doc.strokes.push(stroke)
    })
  }
}

export default Widget.create(
  "Board",
  withAvailableSize(Board, (domElement: HTMLElement, notify: () => void) => {
    const observer = new ResizeObserver(() => notify())
    observer.observe(domElement)
    return () => observer.unobserve(domElement)
  }),
  Board.reify,
  BoardActor,
)
