import * as React from "react"
import { ZoomNavIdDataAttr, NavContext, ZoomableContent } from "./ZoomNav"
import * as css from "./Zoomable.css"

// Accept props without nesting/object wrapper to avoid shallow comparison update
export interface ZoomableProps {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  onZoomStart: (id: string) => void
  children: (zoomProgress: number) => JSX.Element
}

// Class static contextType isn't working :/ Use a wrapper instead.
export default class Zoomable extends React.Component<ZoomableProps> {
  render() {
    const { children, ...rest } = this.props
    return (
      <NavContext.Consumer>
        {ctx => {
          const { zoomState, ...restCtx } = ctx
          let zoomProgress = 0
          if (zoomState && zoomState.zoomable.id === this.props.id) {
            zoomProgress = zoomState.zoomProgress
          }
          return (
            <WrappedZoomable {...rest} {...restCtx} zoomProgress={zoomProgress}>
              {this.props.children}
            </WrappedZoomable>
          )
        }}
      </NavContext.Consumer>
    )
  }
}

interface WrappedZoomableProps extends ZoomableProps {
  zoomProgress: number
  addZoomable: (zoomable: ZoomableContent) => void
  removeZoomable: (id: string) => void
}

class WrappedZoomable extends React.PureComponent<WrappedZoomableProps> {
  componentDidMount() {
    this.addZoomable()
  }

  componentDidUpdate() {
    this.addZoomable()
  }

  componentWillUnmount() {
    this.props.removeZoomable(this.props.id)
  }

  onZoomStart = () => {
    this.props.onZoomStart(this.props.id)
  }

  addZoomable() {
    const { id, url, x, y, height, width } = this.props
    const zoomTarget = {
      size: { width, height },
      position: { x, y },
    }
    this.props.addZoomable({
      id,
      url,
      zoomTarget,
      onZoomStart: this.onZoomStart,
    })
  }

  render() {
    const { id, zoomProgress } = this.props
    const props = {
      [ZoomNavIdDataAttr]: id,
    }
    return (
      <div {...props} className={css.Zoomable}>
        {this.props.children(zoomProgress)}
      </div>
    )
  }
}
