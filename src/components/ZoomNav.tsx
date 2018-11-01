import * as React from "react"
import * as PinchMetrics from "../logic/PinchMetrics"
import Pinchable from "./Pinchable"
import Content, { Mode } from "./Content"
import { find } from "lodash"
import * as SizeUtils from "../logic/SizeUtils"
import * as Zoom from "../logic/Zoom"
import * as css from "./css/ZoomNav.css"

export const ZoomNavIdDataAttr = "data-zoomnav-id"
const ZOOM_THRESHOLD = 0.4
export type NavEntry = { url: string; backZoomTarget?: Zoom.ZoomTarget }
export type ZoomableContent = {
  id: string
  url: string
  zoomTarget: Zoom.ZoomTarget
}
type ZoomState = {
  zoomable: ZoomableContent
  zoomProgress: number
}

interface NavContext {
  zoomState?: ZoomState
  addZoomable: (zoomable: ZoomableContent) => void
  removeZoomable: (id: string) => void
}
export const NavContext = React.createContext<NavContext>({
  zoomState: undefined,
  addZoomable: zoomable => {},
  removeZoomable: id => {},
})

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
  context: {
    zoomState?: ZoomState
    addZoomable: (zoomable: ZoomableContent) => void
    removeZoomable: (id: string) => void
  }
}

export default class ZoomNav extends React.Component<Props, State> {
  zoomables: { [id: string]: ZoomableContent } = {}

  constructor(props: Props) {
    super(props)

    this.state = {
      pinch: undefined,
      context: {
        zoomState: undefined,
        addZoomable: this.addZoomable,
        removeZoomable: this.removeZoomable,
      },
    }
  }

  addZoomable = (zoomable: ZoomableContent) => {
    this.zoomables[zoomable.id] = zoomable
  }

  removeZoomable = (id: string) => {
    delete this.zoomables[id]
  }

  getZoomable = (id: string) => {
    return this.zoomables[id]
  }

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

  changeZoomState(zoomState?: ZoomState) {
    this.setState({
      context: {
        zoomState,
        addZoomable: this.addZoomable,
        removeZoomable: this.removeZoomable,
      },
    })
  }

  clearZoom() {
    this.setState({
      pinch: undefined,
      context: {
        zoomState: undefined,
        addZoomable: this.addZoomable,
        removeZoomable: this.removeZoomable,
      },
    })
  }

  onPinchMove = (pinch: PinchMetrics.Measurements) => {
    const { zoomState } = this.state.context
    if (!this.state.pinch) {
      if (pinch.scale > 1.0) {
        const zoomable = this.findFirstZoomable(pinch.center)
        if (!zoomable) {
          this.clearZoom()
          return
        }
        const zoomState = {
          zoomable,
          zoomProgress: this.getZoomProgress(),
        }
        this.setState({ pinch })
        this.changeZoomState(zoomState)
      } else if (!this.isAtRoot) {
        this.setState({ pinch })
      }
    } else {
      if (zoomState) {
        this.setState({ pinch })
        const updatedZoomState = {
          ...zoomState,
          zoomProgress: this.getZoomProgress(),
        }
        this.changeZoomState(updatedZoomState)
      } else {
        this.setState({ pinch })
      }
    }
  }

  onPinchInEnd = (pinch: PinchMetrics.Measurements) => {
    if (this.isAtRoot || this.state.context.zoomState) {
      this.clearZoom()
      return
    }
    const { backZoomTarget } = this.peek()
    if (backZoomTarget) {
      const scale = this.getScale()
      const zoomProgress = this.getCurrentZoomProgress(scale, backZoomTarget)
      console.log("zoom progress", zoomProgress)
      if (zoomProgress < 1 - ZOOM_THRESHOLD) {
        this.props.onNavBackward()
      }
    }
    this.clearZoom()
  }

  onPinchOutEnd = () => {
    const { zoomState } = this.state.context
    if (!zoomState) {
      this.clearZoom()
      return
    }

    const { zoomProgress, zoomable } = zoomState
    if (zoomProgress > ZOOM_THRESHOLD) {
      this.props.onNavForward(zoomable.url, {
        backZoomTarget: zoomable.zoomTarget,
      })
    }
    this.clearZoom()
  }

  getZoomProgress = () => {
    const { zoomState } = this.state.context
    const { pinch } = this.state
    if (!zoomState || !pinch) {
      return 0
    }
    const { zoomTarget } = zoomState.zoomable
    return Zoom.getZoomInProgress(
      pinch.scale,
      zoomTarget.size,
      VIEWPORT_DIMENSIONS,
    )
  }

  getCurrentZoomProgress = (scale: number, zoomTarget: Zoom.ZoomTarget) => {
    return Zoom.getZoomOutProgress(scale, zoomTarget.size, VIEWPORT_DIMENSIONS)
  }

  getPreviousScale() {
    // Previous scale should begin scaled up, and scale down to 1.0 as we zoom away
    // from a Content.
    const { pinch } = this.state
    const { backZoomTarget } = this.peek()
    if (!pinch || !backZoomTarget) {
      return 1.0
    }
    const scale = Zoom.getScaleDownToTarget(
      pinch.scale,
      backZoomTarget.size,
      VIEWPORT_DIMENSIONS,
    )
    // Scale up one more time.
    return scale * Zoom.getScaleRatio(backZoomTarget.size, VIEWPORT_DIMENSIONS)
  }

  getPreviousOrigin() {
    const { pinch } = this.state
    const { backZoomTarget } = this.peek()
    if (!pinch || !backZoomTarget) {
      return 1.0
    }
    // The previous origin is always based on the back zoom target where we want the
    // current Content to end up.
    const origin = Zoom.getOrigin(backZoomTarget, VIEWPORT_DIMENSIONS)
    return `${origin.x}% ${origin.y}%`
  }

  getScale() {
    const {
      pinch,
      context: { zoomState },
    } = this.state
    const { backZoomTarget } = this.peek()

    // Zooming towards a card
    // If we don't know where to zoom back to, just zoom towards the middle
    // of the previous board.
    if (pinch && zoomState) {
      const { zoomTarget } = zoomState.zoomable
      return Zoom.getScaleUpFromTarget(
        pinch.scale,
        zoomTarget.size,
        VIEWPORT_DIMENSIONS,
      )
    } else if (pinch && pinch.scale < 1.0) {
      if (backZoomTarget) {
        return Zoom.getScaleDownToTarget(
          pinch.scale,
          backZoomTarget.size,
          VIEWPORT_DIMENSIONS,
        )
      } else {
        return Zoom.getScaleDownToTarget(
          pinch.scale,
          SizeUtils.CARD_DEFAULT_SIZE,
          VIEWPORT_DIMENSIONS,
        )
      }
    }
    return 1.0
  }

  getScaleOrigin() {
    const { backZoomTarget } = this.peek()
    const { zoomState } = this.state.context

    // If zooming in, compute the origin based on the zoom target we're zooming towards.
    // Else, if we have a back zoom target, compute the origin based on that back target.
    // Otherwise, if we have no zoom target, default to 50% 50%
    let origin = { x: 50, y: 50 }
    if (zoomState) {
      const { zoomTarget } = zoomState.zoomable
      origin = Zoom.getOrigin(zoomTarget, VIEWPORT_DIMENSIONS)
    } else if (backZoomTarget) {
      origin = Zoom.getOrigin(backZoomTarget, VIEWPORT_DIMENSIONS)
    }
    return `${origin.x}% ${origin.y}%`
  }

  findFirstZoomable = (point: Point): ZoomableContent | undefined => {
    const elements = document.elementsFromPoint(point.x, point.y)
    const firstZoomable = find(elements, el =>
      el.hasAttribute(ZoomNavIdDataAttr),
    )
    const zoomableId =
      firstZoomable && firstZoomable.getAttribute(ZoomNavIdDataAttr)
    return zoomableId ? this.zoomables[zoomableId] : undefined
  }

  render() {
    return (
      <NavContext.Provider value={this.state.context}>
        {this.renderPrevious()}
        {this.renderCurrent()}
      </NavContext.Provider>
    )
  }

  renderPrevious() {
    const previous = this.getPrevious()
    if (!previous) {
      return null
    }

    const previousScale = this.getPreviousScale()
    const previousOrigin = this.getPreviousOrigin()
    const previousStyle: any = { zIndex: -1 }
    if (previousScale !== 1) {
      previousStyle.transform = `scale(${previousScale})`
      previousStyle.transformOrigin = previousOrigin
    }

    return (
      <div style={previousStyle} className={css.Previous}>
        <Content
          mode={this.props.mode}
          url={previous.url}
          scale={previousScale}
          zoomProgress={1}
        />
      </div>
    )
  }

  renderCurrent() {
    const { url: currentUrl, ...currentExtra } = this.peek()

    const scale = this.getScale()
    const scaleOrigin = this.getScaleOrigin()
    const style: any = {}
    if (scale !== 1) {
      style.transform = `scale(${scale})`
      style.transformOrigin = scaleOrigin
    }

    const zoomTarget = currentExtra.backZoomTarget
    const zoomProgress = zoomTarget
      ? this.getCurrentZoomProgress(scale, zoomTarget)
      : 1.0

    return (
      <Pinchable
        onPinchMove={this.onPinchMove}
        onPinchInEnd={this.onPinchInEnd}
        onPinchOutEnd={this.onPinchOutEnd}>
        <div data-zoom-current style={style} className={css.Current}>
          <Content
            key={currentUrl}
            mode={this.props.mode}
            url={currentUrl}
            zoomProgress={zoomProgress}
            {...currentExtra}
            onNavigate={this.props.onNavForward}
          />
        </div>
      </Pinchable>
    )
  }
}
