import * as Preact from "preact"
import Content from "./Content"

export interface Props {
  type: string
  id?: string
}

export default class Card extends Preact.Component<Props> {
  render() {
    const { type, id, ...rest } = this.props
    return (
      <div className="Card" style={style.Card} {...rest}>
        <Content type={type} id={id} />
      </div>
    )
  }
}

const style = {
  Card: {
    width: 320,
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "white",
    borderRadius: 6,
    overflow: "hidden",
    boxShadow: "0 0 12px -5px rgba(0,0,0,0.5)",
    display: "grid",
    gridTemplateRows: "auto",
    gridTemplateColumns: "auto",
  },
}
