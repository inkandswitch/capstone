import * as React from "react"
import Interactable from "./Interactable"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { omit } from "lodash"

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
  onResizeStop?: (scaleFactor: number, id: string) => void
  onDoubleTap?: (url: string) => void
}

export default class InteractableCard extends React.Component<Props, State> {
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

  onResize = (scaleFactor: number) => {
    const currentSize = {
      width: this.props.card.width * scaleFactor,
      height: this.props.card.height * scaleFactor,
    }
    this.setState({ currentSize })
  }

  resizeStop = (scaleFactor: number) => {
    this.props.onResizeStop &&
      this.props.onResizeStop(scaleFactor, this.props.card.id)
  }

  cancel = (data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
    this.props.onResizeStop &&
      this.props.onResizeStop(
        1.0, //TODO
        this.props.card.id,
      )
  }

  render() {
    const {
      card: { x, y, z, width, height },
      children,
      ...rest
    } = this.props

    const { currentSize } = this.state

    return (
      <Interactable
        position={{ x, y }}
        size={{ width, height }}
        onStart={this.start}
        onDragStop={this.dragStop}
        onResize={this.onResize}
        onResizeStop={this.resizeStop}
        z={z}>
        <Card
          cardId={this.props.card.id}
          style={{ width: currentSize.width, height: currentSize.height }}
          {...omit(rest, ["onDoubleTap", "onDragStop", "onResizeStop"])}>
          {children}
        </Card>
      </Interactable>
    )
  }
}
