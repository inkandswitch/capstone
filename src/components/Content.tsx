import * as Preact from "preact"

interface Widget extends Preact.Component<{ id: string }, any> {}

type WidgetClass = {
  new (...k: any[]): Widget
}

export interface Props {
  type: string
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

    return Widget ? (
      <Widget id={this.props.id} {...this.props} />
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
