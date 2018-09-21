// TODO: does these belong here?
export function isString(obj: any) {
  return Object.prototype.toString.call(obj) === "[object String]"
}
export function isPlainObject(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Object]"
}

export const WARNING_STACK_SIZE = 1000
export type selectFn = (obj: any) => boolean

// TODO: no cycle detection. Not a huge deal atm because this is currently
// used for finding document links within a single document. Cycles within
// a document are unlikely, even though cycles across/between documents is common.
export function iterativeDFS(root: any, select: selectFn): any[] {
  const stack = [root]
  const results: any[] = []
  while (stack.length) {
    // No cycle detection, so at least leave a trace if something might be going wrong.
    if (stack.length > WARNING_STACK_SIZE) {
      console.log(
        "Traverse.iterativeDFS large stack size warning.",
        `Stack size: ${stack.length}`,
        root,
      )
    }
    const obj = stack.pop()
    if (isPlainObject(obj)) {
      Object.keys(obj).forEach((key: any) => stack.push(obj[key]))
    } else if (obj.forEach) {
      obj.forEach((val: any) => stack.push(val))
    } else if (select(obj)) {
      results.push(obj)
    }
  }
  return results
}
