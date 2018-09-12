import * as Preact from "preact"
import Draggable from "../modules/draggable/index"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import Touch, { TouchEvent } from "./Touch"
import StrokeRecognizer, { Stroke, GLYPHS } from "./StrokeRecognizer"

interface CardModel {
  id: string
  x: number
  y: number
  z: number
  url: string
}

export interface Props {
  card: CardModel
  onDragStart: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onPinchEnd?: (url: string) => void
  onTap?: (id: string) => void
  onDelete: (id: string) => void
}

export default class DraggableCard extends Preact.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.card !== nextProps.card
  }

  render() {
    const {
      card: { x, y, z },
      children,
      ...rest
    } = this.props

    return (
      <StrokeRecognizer onStroke={this.onStroke} maxScore={10}>
        <Touch onPinchEnd={this.onPinchEnd} onTap={this.onTap}>
          <Draggable
            defaultPosition={{ x, y }}
            onStart={this.start}
            onStop={this.stop}
            onCancel={this.cancel}
            z={z}
            enableUserSelectHack={false}>
            <Card {...rest}>{children}</Card>
          </Draggable>
        </Touch>
      </StrokeRecognizer>
    )
  }

  onTap = (event: TouchEvent) => {
    const { onTap, card } = this.props
    onTap && onTap(card.id)
  }

  onPinchEnd = (event: TouchEvent) => {
    if (event.scale < 1) return // TODO: maybe build this into Touch
    const { onPinchEnd, card } = this.props
    onPinchEnd && onPinchEnd(card.url)
  }

  onStroke = (stroke: Stroke) => {
    switch (stroke.name) {
      case GLYPHS.delete:
        this.props.onDelete(this.props.card.id)
    }
  }

  start = () => {
    this.props.onDragStart(this.props.card.id)
  }

  stop = (e: PointerEvent, data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
  }

  cancel = (data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
  }
}
