import * as Preact from "preact"

interface Widget extends Preact.Component<{ id: string; view: View }, any> {}

export type WidgetClass = {
  new (...k: any[]): Widget
}

export type View = "default" | "preview"

export interface Props {
  type: string
  view?: View
  id?: string
}

export default class Content extends Preact.Component<Props & any> {
  static registry: { [type: string]: WidgetClass } = {}

  static register(type: string, component: WidgetClass) {
    this.registry[type] = component
  }

  find(): WidgetClass | null {
    return this.registry[this.props.type] || null
  }

  get registry() {
    return Content.registry
  }

  render() {
    const Widget = this.find()
    const view = this.props.view || "default"

    return Widget ? (
      <Widget id={this.props.id} view={view} {...this.props} />
    ) : (
      <Missing type={this.props.type} />
    )
  }
}

export class Missing extends Preact.Component<{ type: string }> {
  render() {
    return <div>'{this.props.type}' not found in Content.registry</div>
  }
}
