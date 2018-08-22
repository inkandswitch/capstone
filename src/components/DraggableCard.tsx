import * as Preact from "preact"
import Draggable from "../draggable/index"
import Card from "./Card"
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
  onPinchEnd?: (url: string) => void
}

export default class DraggableCard extends Preact.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.card !== nextProps.card
  }

  render() {
    const {
      card: { x, y, z },
      children,
    } = this.props

    return (
      <Gesture onPinchEnd={this.onPinchEnd}>
        <Draggable
          defaultPosition={{ x, y }}
          onStart={this.start}
          z={z}
          enableUserSelectHack={false}>
          <Card>{children}</Card>
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
}
