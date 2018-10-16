
let start = Date.now()

export function age() : string {
  return `${Date.now() - start}ms`
}
