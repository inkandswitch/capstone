declare module "preact-portal" {
  import * as Preact from "preact"
  export interface Portal extends Preact.Component<any, any> {}
  export interface PortalClass {
    new (...k: any[]): Portal
  }
  const Portal: PortalClass
  export default Portal
}
