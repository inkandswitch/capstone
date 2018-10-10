// This file is only imported by webpack, but not node
export default class WebSocket2 extends WebSocket {
  constructor(url: string) {
    super(url)
    this.binaryType = "arraybuffer"
  }
}
