export interface Env {
  isTouchscreen: boolean
}

export function create(): Env {
  return store({
    isTouchscreen: navigator.maxTouchPoints > 0,
  })
}

export function load(): Env {
  const { env } = localStorage
  return env ? JSON.parse(env) : create()
}

export function store(env: Env): Env {
  localStorage.env = JSON.stringify(env)
  return env
}

export function raw() {
  return JSON.stringify(load())
}
