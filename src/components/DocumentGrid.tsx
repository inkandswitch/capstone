import * as Preact from "preact"

export default class Grid extends Preact.Component {
  render() {
    return <div style={style.Grid}>{this.props.children}</div>
  }
}

const style = {
  Grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gridAutoRows: "1fr",
    gridGap: "10px",
    width: "100%",
  },
}
