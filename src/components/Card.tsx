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
    height: 200,
    width: 320,
    fontSize: 11,
    lineHeight: 1.4,
    backgroundColor: "white",
    border: "1px solid #f0f0f0",
    borderRadius: 6,
    overflow: "hidden",
    boxShadow: "0px 6px 12px -8px rgba(0,0,0,0.1)",
    display: "grid",
    gridTemplateRows: "auto",
    gridTemplateColumns: "auto",
  },
}
