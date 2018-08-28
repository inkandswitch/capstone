import * as Preact from "preact"
import Draggable from "../draggable/index"
import Card from "./Card"
import { DraggableData } from "../draggable/types"
import Touch, { TouchEvent } from "./Touch"
import StrokeRecognizer, { Stroke } from "./StrokeRecognizer"

interface CardModel {
  x: number
  y: number
  z: number
  url: string
}

export interface Props {
  card: CardModel
  index: number
  onDragStart: (idx: number) => void
  onDragStop?: (x: number, y: number, idx: number) => void
  onPinchEnd?: (url: string) => void
  onTap?: (idx: number) => void
  onDelete: (idx: number) => void
  [propName: string]: any
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
      <StrokeRecognizer only={["X"]} onStroke={this.onStroke} maxScore={10}>
        <Touch onPinchEnd={this.onPinchEnd} onTap={this.onTap}>
          <Draggable
            defaultPosition={{ x, y }}
            onStart={this.start}
            onStop={this.stop}
            z={z}
            enableUserSelectHack={false}>
            <Card {...rest}>{children}</Card>
          </Draggable>
        </Touch>
      </StrokeRecognizer>
    )
  }

  onTap = (event: TouchEvent) => {
    const { onTap, index } = this.props
    onTap && onTap(index)
  }

  onPinchEnd = (event: TouchEvent) => {
    if (event.scale < 1) return // TODO: maybe build this into Touch
    const { onPinchEnd, card } = this.props
    onPinchEnd && onPinchEnd(card.url)
  }

  onStroke = (stroke: Stroke) => {
    switch (stroke.name) {
      case "X":
        this.props.onDelete(this.props.index)
    }
  }

  start = () => {
    this.props.onDragStart(this.props.index)
  }

  stop = (e: PointerEvent, data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.index)
  }
}
