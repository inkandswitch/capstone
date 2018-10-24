import * as React from "react"
import { CSSTransition, TransitionGroup } from "react-transition-group"
import { clamp, isEmpty, size, noop } from "lodash"
import * as Widget from "./Widget"
import Mirrorable from "./Mirrorable"
import InteractableCard, { CardModel } from "./InteractableCard"
import Pinchable from "./Pinchable"
import EdgeBoardCreator from "./EdgeBoardCreator"
import Content, {
  DocumentActor,
  Message,
  ReceiveDocuments,
  DocumentCreated,
} from "./Content"
import * as Reify from "../data/Reify"
import * as Link from "../data/Link"
import * as UUID from "../data/UUID"
import { EditDoc, AnyDoc } from "automerge/frontend"
import * as Position from "../logic/Position"
import Ink, { InkStroke } from "./Ink"
import * as SizeUtils from "../logic/SizeUtils"
import * as DataImport from "./DataImport"
import * as css from "./css/Board.css"
import * as PinchMetrics from "../logic/PinchMetrics"

const withAvailableWidth = require("react-with-available-width")
const boardIcon = require("../assets/board_icon.svg")

// TODO: not a constant
const BOARD_DIMENSIONS = { height: 800, width: 1200 }

export interface Model {
  cards: { [id: string]: CardModel | undefined }
  strokes: InkStroke[]
  topZ: number
}

interface Props extends Widget.Props<Model, WidgetMessage> {
  availableWidth: number
  onNavigate?: (url: string, extraProps?: {}) => void
  onNavigateBack?: () => void
  scale?: number
  transformOrigin?: string
  noInk?: boolean
  zIndex?: number
}

interface State {
  pinch?: PinchMetrics.Measurements
  scalingCard?: string
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

const BOARD_CREATE_TARGET_SIZE = 20

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
          this.change(doc => addCard(url, doc, size, { x: 200, y: 50 }))
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

function getCardSize(url: string): Promise<Size> {
  const { width, height } = Link.parse(url).params

  if (width && height) {
    return Promise.resolve({ width, height })
  }

  return new Promise((resolve, reject) => {
    Content.open(url, doc => {
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

class Board extends React.Component<Props, State> {
  boardEl?: HTMLDivElement
  state: State = { pinch: undefined }

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

    console.log("drop", event)

    const { clientX, clientY } = event

    DataImport.importData(event.dataTransfer).forEach(
      async (urlPromise, idx) => {
        console.log("importing", idx)

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

  onDoubleTap = (url: string) => {
    this.props.onNavigate && this.props.onNavigate(url)
  }

  onBoardPinchStart = (measurements: PinchMetrics.Measurements) => {
    this.setState({
      pinch: measurements,
    })
  }

  onBoardPinchMove = (measurements: PinchMetrics.Measurements) => {
    this.setState({ pinch: measurements })
  }

  onBoardPinchInEnd = (measurements: PinchMetrics.Measurements) => {
    console.log("board pinch in  end")
    //this.setState({ pinch: undefined })
    const didNavigate = this.props.onNavigateBack && this.props.onNavigateBack()
    if (!didNavigate) {
      this.setState({ pinch: undefined })
    }
  }

  onPinchStart = (cardId: string, measurements: PinchMetrics.Measurements) => {
    const card = this.props.doc.cards[cardId]
    if (!card) {
      return
    }
    this.setState({
      pinch: measurements,
      scalingCard: cardId,
    })
    this.props.change(doc => {
      const card = doc.cards[cardId]
      if (!card) return
      if (card.z === doc.topZ) return
      card.z = ++doc.topZ
    })
  }

  onPinchMove = (cardId: string, measurements: PinchMetrics.Measurements) => {
    const card = this.props.doc.cards[cardId]
    if (!card) {
      return
    }
    this.setState({
      pinch: measurements,
    })
  }

  onPinchOutEnd = (cardId: string) => {
    const card = this.props.doc.cards[cardId]
    if (!card) {
      return
    }
    console.log("pinch out end")
    const scaleStyle = getBoardScaleStyle(card, this.state.pinch!)
    this.props.onNavigate &&
      this.props.onNavigate(card.url, {
        transformOrigin: scaleStyle.transformOrigin,
      })
  }

  render() {
    const { noInk } = this.props
    const { cards, strokes, topZ } = this.props.doc
    const { pinch, scalingCard } = this.state
    switch (this.props.mode) {
      case "fullscreen": {
        // Get scale transform if zooming into a card.
        let style = {}
        if (pinch && scalingCard && cards) {
          const card = cards[scalingCard]
          if (card) {
            Object.assign(style, getBoardScaleStyle(card, pinch))
          }
        } else if (pinch && pinch.scale < 1.0) {
          Object.assign(style, {
            transform: `scale(${pinch.scale})`,
            transformOrigin: this.props.transformOrigin || "50% 50%",
          })
        }
        if (this.props.zIndex) {
          style["zIndex"] = this.props.zIndex
        }

        return (
          <Pinchable
            onPinchStart={this.onBoardPinchStart}
            onPinchMove={this.onBoardPinchMove}
            onPinchInEnd={this.onBoardPinchInEnd}>
            <div
              data-container
              className={css.Board}
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
                  let navScale = 0
                  if (pinch && scalingCard && scalingCard === card.id) {
                    navScale = getCardScaleProgress(card, pinch)
                  }
                  return (
                    <CSSTransition
                      key={card.id}
                      classNames="Card"
                      enter={false}
                      timeout={{ exit: 1 }}>
                      <Mirrorable cardId={card.id} onMirror={this.onMirror}>
                        <InteractableCard
                          card={card}
                          onPinchStart={this.onPinchStart}
                          onPinchMove={this.onPinchMove}
                          onPinchOutEnd={this.onPinchOutEnd}
                          onDoubleTap={this.props.onNavigate}
                          onDragStart={this.onDragStart}
                          onDragStop={this.onDragStop}
                          onRemoved={this.onRemoved}
                          onResizeStop={this.onResizeStop}>
                          <Content
                            mode="embed"
                            url={card.url}
                            scale={navScale}
                          />
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
            </div>
          </Pinchable>
        )
      }
      case "embed": {
        const contentScale = this.props.availableWidth / BOARD_DIMENSIONS.width
        const { scale } = this.props
        const style = {
          transform: `scale(${contentScale})`,
          willChange: "transform",
          transformOrigin: "top left",
        }
        const overlayOpacity = 0.6 + 0.4 * (scale ? clamp(scale, 0, 1) : 0)

        return (
          <div className={css.BoardEmbed} ref={this.onRef}>
            <div className={css.BoardEmbedBackground} />
            <div style={{ opacity: overlayOpacity }}>
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
                    <InteractableCard
                      key={card.id}
                      card={card}
                      onPinchOutEnd={noop}
                      onDragStart={noop}
                      onDragStop={noop}
                      onResizeStop={noop}>
                      <Content mode="preview" url={card.url} />
                    </InteractableCard>
                  )
                })}
              </div>
            </div>
          </div>
        )
      }
      case "preview": {
        return (
          <div className={css.BoardPreview}>
            <img className={css.Icon} src={boardIcon} />
            <div className={css.TitleContainer}>
              <div className={css.Title}>Board</div>
              <div className={css.SubTitle}>
                {isEmpty(cards) ? "No" : size(cards)} items
              </div>
            </div>
          </div>
        )
      }
    }
  }

  onInkStroke = (strokes: InkStroke[]) => {
    this.props.change(doc => {
      doc.strokes.push(...strokes)
    })
  }
}

function getBoardScaleStyle(
  card: CardModel,
  pinchMeasurements: PinchMetrics.Measurements,
) {
  const { x, y, height, width } = card
  const origin = {
    x: (x / (BOARD_DIMENSIONS.width - width)) * 100,
    y: (y / (BOARD_DIMENSIONS.height - height)) * 100,
  }
  const transformOrigin = `${origin.x}% ${origin.y}%`

  const maxScale = BOARD_DIMENSIONS.width / width
  const transform = Math.min(pinchMeasurements.scale, maxScale)

  return {
    transform: `scale(${transform})`,
    transformOrigin: transformOrigin,
  }
}

function getCardScaleProgress(
  card: CardModel,
  pinchMeasurements: PinchMetrics.Measurements,
) {
  const { scale } = pinchMeasurements
  const { width } = card
  const maxScale = BOARD_DIMENSIONS.width / width
  // 1.0 is the minimum, so ignore figure out progress beyond 1.0
  const adjustedScale = scale - 1.0
  const adjustedMax = maxScale - 1.0
  return adjustedScale / adjustedMax
}

export default Widget.create(
  "Board",
  withAvailableWidth(Board, (domElement: HTMLElement, notify: () => void) => {
    const observer = new ResizeObserver(() => notify())
    observer.observe(domElement)
    return () => observer.unobserve(domElement)
  }),
  Board.reify,
  BoardActor,
)
