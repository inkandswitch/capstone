// Cribbed from https://github.com/developit/preact/issues/531
import * as Preact from "preact"

export default function installRenderErrorHandler() {
  const originalVnode = Preact.options.vnode
  Preact.options.vnode = vnode => {
    if (typeof vnode.nodeName === "function") {
      if (isFunctionalComponent(vnode.nodeName)) {
        vnode.nodeName = wrapFunctionalComponent(vnode.nodeName)
      } else {
        wrapComponent(vnode.nodeName)
      }
    }
    if (originalVnode) {
      originalVnode(vnode)
    }
  }

  function wrapComponent(Component: any) {
    if (
      Component.prototype &&
      Component.prototype.render &&
      !Component.__safe
    ) {
      Component.__safe = true // only wrap components once
      const originalRender = Component.prototype.render
      Component.prototype.render = function render(...args: unknown[]) {
        try {
          return originalRender.apply(this, args)
        } catch (e) {
          console.log(`error rendering component ${this.constructor.name}`)
          return null
        }
      }
    }
  }

  function wrapFunctionalComponent(FnComponent: any) {
    // only generate safe wrapper once
    if (FnComponent.__safe) return FnComponent.__safe

    function Wrapper(props: {}, context: {}) {
      try {
        return FnComponent.call(this, props, context)
      } catch (err) {
        console.error(err)
      }
    }
    ;(Wrapper as any).displayName = getDisplayName(FnComponent)
    FnComponent.__safe = Wrapper
    return FnComponent.__safe
  }

  function isFunctionalComponent(Component: any) {
    return (
      Component &&
      typeof Component === "function" &&
      !(Component.prototype && Component.prototype.render)
    )
  }

  function getDisplayName(Component: any) {
    return Component.displayName || Component.name || "Component"
  }
}
