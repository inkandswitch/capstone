import * as React from "react"
import * as PinchMetrics from "../logic/PinchMetrics"
import Pinchable from "./Pinchable"
import Content, { Mode } from "./Content"
import { find } from "lodash"

export type NavEntry = { url: string; [extra: string]: any }

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
  }

  onPinchOutEnd = () => {
    const { pinch } = this.state
    if (!pinch) return
    const zoomable = this.findFirstZoomable(pinch.center)
    if (!zoomable || !zoomable.hasAttribute("data-zoomnav-url")) return
    const url = zoomable.getAttribute("data-zoomnav-url")!
    const rect = zoomable.getBoundingClientRect()
    this.props.onNavForward(url, { originRect: rect })
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

    return (
      <>
        {previous ? (
          <Content
            key={previous.url + "-previous"} // Force a remount.
            mode={this.props.mode}
            url={previous.url}
            zIndex={-1}
          />
        ) : null}
        <Pinchable
          onPinchMove={this.onPinchMove}
          onPinchInEnd={this.onPinchInEnd}
          onPinchOutEnd={this.onPinchOutEnd}>
          <div data-zoom-current>
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
}

export interface ZoomableProps {
  id: string
  url: string
}

export class Zoomable extends React.Component<ZoomableProps> {
  render() {
    const { id, url } = this.props
    return (
      <div data-zoomnav-zoomable data-zoomnav-url={url} data-zoomnav-id={id}>
        {this.props.children}
      </div>
    )
  }
}

export const zoomableProps = (url: string) => ({
  "data-zoomnav-zoomable": true,
  "data-zoomnav-url": url,
})
