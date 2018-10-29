import { defaults } from "lodash"

export interface Env {
  isTouchscreen: boolean
  device: "capstone" | "sidecar"
}

export function defaultEnv(): Env {
  return {
    isTouchscreen: navigator.maxTouchPoints > 0,
    device: "capstone",
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
