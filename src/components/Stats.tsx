import * as React from "react"
import * as Stats from "stats.js"

interface Props {}

export default class CapstoneStats extends React.Component<Props> {
  ref?: HTMLDivElement
  rafHandle?: number
  stats: Stats[] = []

  componentDidMount() {
    this.stats = [new Stats(), new Stats(), new Stats()]

    this.stats[0].showPanel(0) // cpu
    this.stats[1].showPanel(1) // frame ms
    this.stats[2].showPanel(2) // mem

    this.rafHandle = requestAnimationFrame(this.update)
    this.stats.forEach((stats, i) => {
      if (!this.ref) return

      stats.dom.style.top = `${i * 48}px`
      this.ref.appendChild(stats.dom)
    })
  }

  update = () => {
    this.stats.forEach(stats => stats.update())
    this.rafHandle = requestAnimationFrame(this.update)
  }

  componentWillUnmount() {
    if (!this.rafHandle) return

    cancelAnimationFrame(this.rafHandle)
  }

  onRef = (ref: HTMLDivElement) => {
    this.ref = ref
  }

  render() {
    return <div ref={this.onRef} />
  }
}
