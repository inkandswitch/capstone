declare module "automerge" {
  function init(actorId?: string): Doc<{}>

  function change<T>(doc: Doc<T>, msg: string, cb: ChangeFn<T>): Doc<T>
  function change<T>(doc: Doc<T>, cb: ChangeFn<T>): Doc<T>

  function emptyChange<T>(doc: Doc<T>, msg: string): Doc<T>

  /// Readonly document types:

  type Value = null | string | number | boolean | Object | ValueList

  // A homogeneous list of Values
  interface List<T extends Value> extends ReadonlyArray<T> {}

  // A heterogeneous list of Values
  interface ValueList extends List<Value> {}

  type Text = List<string>

  interface Object {
    readonly [key: string]: Readonly<Value>
  }

  interface AnyDoc extends Object {
  }

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
    readonly _objectId: string
    [key: string]: EditValue
  }

  interface AnyEditDoc extends EditObject {
    readonly _actorId: string
  }

  // includes _actorId and any properties in T, all other keys are 'unknown'
  type EditDoc<T> = AnyEditDoc & T

  interface ChangeFn<T> {
    (doc: Doc<T>): Doc<T>
  }
}
