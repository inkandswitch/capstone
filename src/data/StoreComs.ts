export type Send<Msg> = (msg: Msg) => void

export default class StoreComs<Msg> {
  private realSend?: Send<Msg>
  private sendQueue: Msg[] = []

  get send() {
    return (
      this.realSend ||
      ((msg: Msg) => {
        this.sendQueue.push(msg)
      })
    )
  }

  set send(send: Send<Msg>) {
    this.realSend = send
    this.sendQueue.forEach(msg => {
      send(msg)
    })
    this.sendQueue = []
  }
}
