export function throttle(fn: () => void): () => void {
  // Throttles a function call to animation frames.
  let pending = false

  function run() {
    if (pending) return
    requestAnimationFrame(() => {
      pending = false
      fn()
    })
    pending = true
  }

  return run
}
