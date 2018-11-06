import { defaults } from "lodash"

export interface Env {
  isTouchscreen: boolean
  device: "capstone" | "sidecar"
}

declare global {
  namespace NodeJS {
    interface Global {
      navigator: any
    }
  }
}

export function defaultEnv(): Env {
  return {
    isTouchscreen: global.navigator ? navigator.maxTouchPoints > 0 : false,
    device: global.navigator
      ? navigator.userAgent.includes("CrOS")
        ? "capstone"
        : "sidecar"
      : "sidecar",
  }
}

export function create(): Env {
  return store(defaultEnv())
}

export function load(): Env {
  const { env } = localStorage
  return env ? defaults(JSON.parse(env), defaultEnv()) : create()
}

export function store(env: Env): Env {
  localStorage.env = JSON.stringify(env)
  return env
}

export function raw() {
  return JSON.stringify(load())
}
