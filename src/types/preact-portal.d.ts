import * as Preact from "preact"

declare module "preact-portal" {
  interface Portal extends Preact.Component<any, any> {}
  type PortalClass = {
    new (...k: any[]): Portal
  }
}
