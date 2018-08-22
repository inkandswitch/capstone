import * as Preact from "preact"
import Draggable from "../draggable/index"
import Card from "./Card"
import { MouseTouchEvent, DraggableData } from "../draggable/types"
import Gesture from "./Gesture"

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
      <Gesture onPinchEnd={this.onPinchEnd}>
        <Draggable
          bounds="parent"
          defaultPosition={{ x, y }}
          onStart={this.start}
          onStop={this.stop}
          z={z}
          enableUserSelectHack={false}>
          <Card {...rest}>{children}</Card>
        </Draggable>
      </Gesture>
    )
  }

  onPinchEnd = (event: HammerInput) => {
    if (event.scale < 1) return // TODO: maybe build this into Gesture
    const { onPinchEnd, card } = this.props
    onPinchEnd && onPinchEnd(card.url)
  }

  start = () => {
    this.props.onDragStart(this.props.index)
  }

  stop = (e: MouseTouchEvent, data: DraggableData) => {
    console.log(`x: ${data.x} y: ${data.y}`)
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.index)
  }
}
