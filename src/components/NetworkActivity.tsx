import * as Preact from "preact"
import * as Link from "../data/Link"
import Content, { Mode } from "./Content"
import Store, { Activity } from "../data/Store"
import * as css from "./css/NetworkActivity.css"

interface Props {
  store: Store
  mode: Mode
  url: string
}

export default class NetworkActivity extends Preact.Component<Props> {
  id = Link.parse(this.props.url).id
  upload: HTMLElement | null
  download: HTMLElement | null

  static reify() {
    return {}
  }

  componentDidMount() {
    this.props.store.activity(this.id).subscribe(this.onActivity)
  }

  render() {
    return (
      <div className={css.NetworkActivity}>
        <div className={css.Status} />
        <div className={css.Upload} ref={el => (this.upload = el)} />
        <div className={css.Download} ref={el => (this.download = el)} />
      </div>
    )
  }

  onActivity = (act: Activity) => {
    switch (act.type) {
      case "Download":
        this.download && this.blink(this.download, css.lit)
        break
      case "Upload":
        this.upload && this.blink(this.upload, css.lit)
        break
    }
  }

  blink(el: HTMLElement, className: string) {
    requestAnimationFrame(() => {
      el.classList.add(className)
      requestAnimationFrame(() => {
        // A single frame is not enough apparently
        requestAnimationFrame(() => {
          el.classList.remove(className)
        })
      })
    })
  }
}

Content.registerWidget("NetworkActivity", NetworkActivity)
