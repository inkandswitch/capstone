import * as React from "react"
import * as PinchMetrics from "../logic/PinchMetrics"
import Pinchable from "./Pinchable"
import Content, { Mode } from "./Content"
import { clamp, find } from "lodash"
import * as SizeUtils from "../logic/SizeUtils"
import * as css from "./css/ZoomNav.css"

export type NavEntry = { url: string; backZoomTarget?: ZoomTarget }
export type ZoomTarget = { url: string; position: Point; size: Size }

const VIEWPORT_DIMENSIONS = { height: 800, width: 1200 }

interface Props {
  navStack: NavEntry[]
  rootUrl: string
  mode: Mode
  onNavForward: (url: string, extraProps?: {}) => void
  onNavBackward: () => void
}

interface State {
  pinch?: PinchMetrics.Measurements
  inbound?: Element
}

export default class ZoomNav extends React.Component<Props, State> {
  state: State = { pinch: undefined, inbound: undefined }

  peek = () => {
    const { navStack, rootUrl } = this.props
    return navStack[navStack.length - 1] || { url: rootUrl }
  }

  getPrevious = () => {
    const { navStack, rootUrl } = this.props
    if (navStack.length === 0) {
      return
    } else if (navStack.length === 1) {
      return { url: rootUrl }
    } else {
      return navStack[navStack.length - 2]
    }
  }

  get isAtRoot() {
    return this.peek().url === this.props.rootUrl
  }

  onPinchMove = (pinch: PinchMetrics.Measurements) => {
    if (pinch.scale > 1.0) {
      if (this.state.inbound) {
        this.setState({ pinch })
      } else {
        const zoomable = this.findFirstZoomable(pinch.center)
        if (!zoomable) {
          this.setState({ pinch: undefined, inbound: undefined })
        } else {
          this.setState({
            pinch,
            inbound: zoomable,
          })
        }
      }
    } else {
      if (this.isAtRoot) {
        this.setState({ pinch: undefined, inbound: undefined })
      } else {
        this.setState({
          pinch,
          inbound: undefined,
        })
      }
    }
  }

  onPinchInEnd = () => {
    if (this.isAtRoot) {
      return
    }
    this.props.onNavBackward()
    this.setState({ pinch: undefined, inbound: undefined })
  }

  onPinchOutEnd = () => {
    const { pinch } = this.state
    if (!pinch) return
    const zoomable = this.findFirstZoomable(pinch.center)
    if (!zoomable) return
    const attrs = getZoomableAttrs(zoomable)
    const { url, ...backZoomTarget } = attrs
    this.props.onNavForward(url!, { backZoomTarget })
    this.setState({ pinch: undefined, inbound: undefined })
  }

  findFirstZoomable = (point: Point): Element | undefined => {
    const elements = document.elementsFromPoint(point.x, point.y)
    const firstZoomable = find(elements, el =>
      el.hasAttribute("data-zoomnav-zoomable"),
    )
    return firstZoomable
  }

  render() {
    const { url: currentUrl, ...currentExtra } = this.peek()

    const previous = this.getPrevious()
    const previousScale = this.getPreviousScale()
    const previousOrigin = this.getPreviousOrigin()
    const previousStyle: any =
      previousScale === 1
        ? {}
        : {
            transform: `scale(${previousScale})`,
            transformOrigin: previousOrigin,
          }

    const scale = this.getScale()
    const scaleOrigin = this.getScaleOrigin()
    const style: any =
      scale === 1
        ? {}
        : {
            transform: `scale(${scale})`,
            transformOrigin: scaleOrigin,
          }

    return (
      <>
        {previous ? (
          <div style={previousStyle} className={css.Previous}>
            <Content
              key={previous.url + "-previous"} // Force a remount.
              mode={this.props.mode}
              url={previous.url}
              zIndex={-1}
            />
          </div>
        ) : null}
        <Pinchable
          onPinchMove={this.onPinchMove}
          onPinchInEnd={this.onPinchInEnd}
          onPinchOutEnd={this.onPinchOutEnd}>
          <div data-zoom-current style={style} className={css.Current}>
            <Content
              key={currentUrl}
              mode={this.props.mode}
              url={currentUrl}
              {...currentExtra}
              onNavigate={this.props.onNavForward}
              onNavigateBack={this.props.onNavBackward}
            />
          </div>
        </Pinchable>
      </>
    )
  }

  getScaleOrigin() {
    const { inbound } = this.state
    const { backZoomTarget } = this.peek()

    if (inbound) {
      const attrs = getZoomableAttrs(inbound)
      const { x, y } = attrs.position
      const { width, height } = attrs.size
      const origin = {
        x: (x / (VIEWPORT_DIMENSIONS.width - width)) * 100,
        y: (y / (VIEWPORT_DIMENSIONS.height - height)) * 100,
      }
      return `${origin.x}% ${origin.y}%`
    } else if (backZoomTarget) {
      const {
        position: { x, y },
        size: { height, width },
      } = backZoomTarget
      const origin = {
        x: (x / (VIEWPORT_DIMENSIONS.width - width)) * 100,
        y: (y / (VIEWPORT_DIMENSIONS.height - height)) * 100,
      }
      return `${origin.x}% ${origin.y}%`
    } else {
      return "50% 50%"
    }
  }

  getScale() {
    const { pinch, inbound } = this.state
    const { backZoomTarget } = this.peek()

    // Zooming towards a card
    if (pinch && inbound) {
      const attrs = getZoomableAttrs(inbound)
      // get relative-scale.
      const boardScale = attrs.size.width / VIEWPORT_DIMENSIONS.width
      const boardScaleMaxScale = 1.0
      const currentBoardScale = clamp(
        pinch.scale * boardScale,
        boardScale,
        boardScaleMaxScale,
      )
      // translate back to absolute-scale
      return currentBoardScale / boardScale
      // TODO:
      // Zooming away from the current board
    } else if (pinch && pinch.scale < 1.0) {
      if (backZoomTarget) {
        const destScale = backZoomTarget.size.width / VIEWPORT_DIMENSIONS.width
        const startScale = 1.0
        return clamp(pinch.scale, destScale, startScale)
      } else {
        // If we don't know where to zoom back to, just zoom towards the middle
        // of the previous board.
        const destScale =
          SizeUtils.CARD_DEFAULT_SIZE.width / VIEWPORT_DIMENSIONS.width
        const startScale = 1.0
        return clamp(pinch.scale, destScale, startScale)
      }
    }
    return 1.0
  }

  getPreviousScale() {
    const { pinch, inbound } = this.state
    const { backZoomTarget } = this.peek()
    if (!pinch || inbound || !backZoomTarget) {
      return 1.0
    }

    const boardScale = backZoomTarget.size.width / VIEWPORT_DIMENSIONS.width
    const minScale = 1.0
    const maxScale = 1.0 / boardScale
    const currentBoardScale = clamp(
      pinch.scale / boardScale,
      minScale,
      maxScale,
    )
    // translate back to absolute-scale
    return currentBoardScale
  }

  getPreviousOrigin() {
    const { pinch, inbound } = this.state
    const { backZoomTarget } = this.peek()

    if (!pinch || inbound || !backZoomTarget) {
      return 1.0
    }

    const {
      position: { x, y },
      size: { height, width },
    } = backZoomTarget
    const origin = {
      x: (x / (VIEWPORT_DIMENSIONS.width - width)) * 100,
      y: (y / (VIEWPORT_DIMENSIONS.height - height)) * 100,
    }
    return `${origin.x}% ${origin.y}%`
  }
}

export interface ZoomableProps {
  url: string
  position: Point
  size: Size
}

export class Zoomable extends React.Component<ZoomableProps> {
  render() {
    // TODO: hacky
    const { url, position, size } = this.props
    const props = {
      "data-zoomnav-zoomable": true,
      "data-zoomnav-url": url,
      "data-zoomnav-x": position.x,
      "data-zoomnav-y": position.y,
      "data-zoomnav-width": size.width,
      "data-zoomnav-height": size.height,
    }
    return <div {...props}>{this.props.children}</div>
  }
}

const getZoomableAttrs = (el: Element) => {
  return {
    url: el.getAttribute("data-zoomnav-url"),
    position: {
      x: +el.getAttribute("data-zoomnav-x")!,
      y: +el.getAttribute("data-zoomnav-y")!,
    },
    size: {
      width: +el.getAttribute("data-zoomnav-width")!,
      height: +el.getAttribute("data-zoomnav-height")!,
    },
  }
}
