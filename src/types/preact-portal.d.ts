declare module "preact-portal" {
  import * as Preact from "preact"

  interface Props {
    into: string
  }

  class Portal extends Preact.Component<Props> {
    constructor(props: Props)
    render(): JSX.Element
  }

  export = Portal
}
