import * as React from "react"
import Interactable from "./Interactable"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { omit } from "lodash"
import * as Link from "../data/Link"
import Navigatable from "./Navigatable"

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
  onDragStart: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onResizeStop?: (newSize: Size, id: string) => void
  onDoubleTap?: (url: string) => void
  onPinchOutEnd?: (url: string) => void
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
    this.props.onDragStart(this.props.card.id)
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

  onPinchOutEnd = () => {
    this.props.onPinchOutEnd && this.props.onPinchOutEnd(this.props.card.url)
  }

  render() {
    const {
      card: { x, y, z, width, height },
      children,
      ...rest
    } = this.props

    const { currentSize } = this.state
    const type = Link.parse(this.props.card.url).type

    return (
      <Navigatable onPinchOutEnd={this.onPinchOutEnd}>
        <Interactable
          position={{ x, y }}
          originalSize={{ width, height }}
          preserveAspectRatio={type === "Image"}
          onStart={this.start}
          onDragStop={this.dragStop}
          onResize={this.onResize}
          onResizeStop={this.resizeStop}
          z={z}>
          <Card
            cardId={this.props.card.id}
            style={{ width: currentSize.width, height: currentSize.height }}
            {...omit(rest, [
              "onDoubleTap",
              "onDragStop",
              "onResizeStop",
              "onPinchOutEnd",
            ])}>
            {children}
          </Card>
        </Interactable>
      </Navigatable>
    )
  }
}
