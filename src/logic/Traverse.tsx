export const RECURSIVE_MAX_DEPTH = 1000 // arbitrary

export function isString(obj: any) {
  return Object.prototype.toString.call(obj) === "[object String]"
}
export function isPlainObject(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Object]"
}
export function isIterable(obj: any) {
  return !!obj[Symbol.iterator]
}

// TODO: Does not check for loops - so just blow up at a max depth for now.
export function recursiveDFS(
  obj: any,
  cb: (val: any) => void,
  depth: number = 0,
  maxDepth: number = RECURSIVE_MAX_DEPTH,
) {
  if (depth >= maxDepth) throw new Error(`Max depth exceeded: ${maxDepth}`)

  if (isIterable(obj) && !isString(obj)) {
    const iterator = obj[Symbol.iterator]()
    let next = iterator.next()
    while (!next.done) {
      // Hack to handle Map iteration, which returns an array of [key, value]
      const val = Array.isArray(next.value) ? next.value[1] : next.value
      recursiveDFS(val, cb, depth + 1, maxDepth)
      next = iterator.next()
    }
  } else if (isPlainObject(obj)) {
    // Note, does not iterate over Symbols.
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        recursiveDFS(obj[prop], cb, depth + 1, maxDepth)
      }
    }
  } else {
    cb(obj)
  }
}
