import * as React from "react"

export default class Grid extends React.Component {
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
