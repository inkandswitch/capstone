declare module "automerge" {
  function init(actorId?: string): Doc<{}>

  function change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>): Doc<T>
  function change<T>(doc: Doc<T>, cb: ChangeFn<T>): Doc<T>

  function emptyChange<T>(doc: Doc<T>, msg: string): Doc<T>

  type Value = null | string | number | boolean | Object | ValueList

  // A homogeneous list of Values
  interface List<T extends Value> extends ReadonlyArray<T> {}

  // A heterogeneous list of Values
  interface ValueList extends List<Value> {}

  type Text = List<string>

  interface Object {
    readonly objectId: string
    readonly [key: string]: Readonly<Value>
  }

  interface AnyDoc extends Object {
    readonly _actorId: string
  }

  // includes _actorId and any properties in T, all other keys are 'unknown'
  type Doc<T> = AnyDoc & T

  interface ChangeFn<T> {
    (doc: T): void
  }
}
