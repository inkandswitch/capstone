import * as React from "react"
import Interactable from "./Interactable"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { omit } from "lodash"
import * as Link from "../data/Link"
import Pinchable from "./Pinchable"
import * as PinchMetrics from "../logic/PinchMetrics"

export interface CardModel {
  id: string
  x: number
  y: number
  z: number
  width: number
  height: number
  url: string
}

export interface State {
  currentSize: Size
}

export interface Props {
  card: CardModel
  onDragStart?: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onResizeStop?: (newSize: Size, id: string) => void
  onDoubleTap?: (url: string) => void
  onPinchStart?: (id: string, measurements: PinchMetrics.Measurements) => void
  onPinchMove?: (id: string, measurements: PinchMetrics.Measurements) => void
  onPinchOutEnd?: (id: string, measurements: PinchMetrics.Measurements) => void
}

export default class InteractableCard extends React.Component<Props, State> {
  node?: Element

  constructor(props: Props) {
    super(props)

    this.state = {
      currentSize: { width: props.card.width, height: props.card.height },
    }
  }

  start = () => {
    this.props.onDragStart && this.props.onDragStart(this.props.card.id)
  }

  dragStop = (x: number, y: number) => {
    this.props.onDragStop && this.props.onDragStop(x, y, this.props.card.id)
  }

  onResize = (newSize: Size) => {
    this.setState({ currentSize: newSize })
  }

  resizeStop = (newSize: Size) => {
    this.props.onResizeStop &&
      this.props.onResizeStop(newSize, this.props.card.id)
  }

  cancel = (data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
    this.props.onResizeStop &&
      this.props.onResizeStop(
        { width: this.props.card.width, height: this.props.card.height },
        this.props.card.id,
      )
  }

  onPinchStart = (measurements: PinchMetrics.Measurements) => {
    this.props.onPinchStart &&
      this.props.onPinchStart(this.props.card.id, measurements)
  }

  onPinchMove = (measurements: PinchMetrics.Measurements) => {
    this.props.onPinchMove &&
      this.props.onPinchMove(this.props.card.id, measurements)
  }

  onPinchOutEnd = (measurements: PinchMetrics.Measurements) => {
    this.props.onPinchOutEnd &&
      this.props.onPinchOutEnd(this.props.card.id, measurements)
  }

  onDoubleTap = () => {
    this.props.onDoubleTap && this.props.onDoubleTap(this.props.card.url)
  }

  render() {
    const {
      card: { x, y, z, width, height },
      children,
      ...rest
    } = this.props

    const { currentSize } = this.state
    const type = Link.parse(this.props.card.url).type
    const style = {
      width: currentSize.width,
      height: currentSize.height,
    }

    return (
      <Pinchable
        onPinchStart={this.onPinchStart}
        onPinchMove={this.onPinchMove}
        onPinchOutEnd={this.onPinchOutEnd}
        onDoubleTap={this.onDoubleTap}>
        <Interactable
          position={{ x, y }}
          originalSize={{ width, height }}
          preserveAspectRatio={
            type === "Image" || type === "Board" || type === "HTML"
          }
          onStart={this.start}
          onDragStop={this.dragStop}
          onResize={this.onResize}
          onResizeStop={this.resizeStop}
          z={z}>
          <Card
            cardId={this.props.card.id}
            style={style}
            {...omit(rest, [
              "onDoubleTap",
              "onDragStop",
              "onResizeStop",
              "onPinchStart",
              "onPinchMove",
              "onPinchOutEnd",
            ])}>
            {children}
          </Card>
        </Interactable>
      </Pinchable>
    )
  }
}
