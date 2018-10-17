import * as React from "react"
import * as ReactDOM from "react-dom"
import Interactable from "./Interactable"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { omit } from "lodash"
import * as Link from "../data/Link"
import * as GPS from "../logic/GPS"
import * as RxOps from "rxjs/operators"

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
  pinchStartDistance?: number
}

export interface Props {
  card: CardModel
  onDragStart: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onResizeStop?: (newSize: Size, id: string) => void
  onDoubleTap?: (url: string) => void
  onPinchInEnd?: (id: string) => void
}

export default class InteractableCard extends React.Component<Props, State> {
  node?: Element

  constructor(props: Props) {
    super(props)

    this.state = {
      currentSize: { width: props.card.width, height: props.card.height },
    }
  }

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this) as Element
    if (!this.node) return

    GPS.stream()
      .pipe(
        RxOps.map(GPS.onlyTouch),
        RxOps.filter(GPS.ifTwoFingerPinch),
        RxOps.map(GPS.toPinchEvent),
      )
      .subscribe(this.onPinch)
  }

  onPinch = (pinchEvent?: GPS.PinchEvent) => {
    if (!pinchEvent || !this.state || !this.node) return
    if (!this.state.pinchStartDistance && pinchEvent.eventType != "pinchend") {
      for (const pointerEvent of pinchEvent.pointerEvents) {
        if (!this.node.contains(pointerEvent.target as Node)) return
      }
      // pinch began
      this.setState({ pinchStartDistance: pinchEvent.distance })
    } else if (
      this.state.pinchStartDistance &&
      pinchEvent.eventType == "pinchend"
    ) {
      // pinch ended
      if (this.state.pinchStartDistance > pinchEvent.distance) {
        // pinch out
      } else if (this.state.pinchStartDistance < pinchEvent.distance) {
        this.props.onPinchInEnd && this.props.onPinchInEnd(this.props.card.id)
      }
      this.setState({ pinchStartDistance: undefined })
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

  render() {
    const {
      card: { x, y, z, width, height },
      children,
      ...rest
    } = this.props

    const { currentSize } = this.state
    const type = Link.parse(this.props.card.url).type

    return (
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
          {...omit(rest, ["onDoubleTap", "onDragStop", "onResizeStop"])}>
          {children}
        </Card>
      </Interactable>
    )
  }
}
