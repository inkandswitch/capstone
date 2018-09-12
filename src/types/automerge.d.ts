declare module "automerge/frontend" {
  function init(actorId?: string): Doc<{}>

  function change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>): Doc<T>
  function change<T>(doc: Doc<T>, cb: ChangeFn<T>): Doc<T>
  function applyPatch(doc: Doc<T>, patch)
  function getRequests(doc: Doc<T>) : any

  function emptyChange<T>(doc: Doc<T>, msg: string): Doc<T>
  const Text: TextConstructor

  /// Readonly document types:

  type Value = null | string | number | boolean | Object | ValueList

  // A homogeneous list of Values
  interface List<T> extends ReadonlyArray<T & Value> {}

  // A heterogeneous list of Values
  interface ValueList extends List<Value> {}

  interface TextConstructor {
    new (): Text
  }

  interface Text extends List<string> {}

  interface Object {
    readonly [key: string]: Readonly<Value>
  }

  interface AnyDoc extends Object {}

  // includes _actorId and any properties in T, all other keys are 'unknown'
  type Doc<T> = AnyDoc & T

  /// Editable document types:

  // A homogeneous list of EditValues
  interface EditList<T extends EditValue> extends Array<T> {}

  // A heterogeneous list of EditValues
  interface EditValueList extends EditList<EditValue> {}

  type EditText = EditList<string>

  type EditValue = null | string | number | boolean | EditObject | EditValueList

  interface EditObject {
    // // TODO: These values don't exist currently:
    // readonly _objectId: string
    // [key: string]: EditValue
    [key: string]: unknown
  }

  interface AnyEditDoc extends EditObject {
    // // TODO: This value doesn't exist currently:
    // readonly _actorId: string
  }

  // includes _actorId and any properties in T, all other keys are 'unknown'
  type EditDoc<T> = AnyEditDoc & T

  interface ChangeFn<T> {
    (doc: EditDoc<T>): EditDoc<T>
  }
}

