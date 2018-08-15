# capstone

## Setup

```sh
yarn install
yarn start
```

We're using [`prettier`](https://prettier.io/) for code formatting.
It should be recommended in the extensions tab of VSCode, and there is
support for [other editors](https://prettier.io/docs/en/editors.html) as well.
Otherwise, you can format the code by running `yarn format`.

## Widgets

Widgets are Preact components that handle the rendering and construction of a document.

A widget component is required to accept two props:

- `url` is a document URL of the form: `capstone://Image/5M23ked3t3UBQGDS5uDqWVNsffebBhmo3PjguECRt7xH/HDP`
- `mode` is a string enum informing the widget how it's expected to render<sup>[1](#footnote1)</sup>. Possible values are:
  - `"fullscreen"`: the widget is full screen.
  - `"embed"`: the widget is embeded in another document (e.g. on the board).
  - `"preview"`: same as "embed", but the widget should not expect user interaction.

### Using a widget

Given a document URL, a widget can be rendered using `Content`:

```typescript
<Content url={url} mode="preview" />
```

### Building a widget

Every widget must implement a `static reify(doc)` method which translates a
free-form document which you hope contains your data into a definitive data
structure you can render. The reify method helps to guarantee that later in
your code you won't encounter runtime errors caused by unexpected `null` or
`undefined` fields or subfields.

To make widgets easier to build, a base `Widget` class is provided.
A basic widget looks like this:

```typescript
import * as Preact from "preact"
import Content from "./Content"
import Widget, { Doc, AnyDoc } from "./Widget"

// These are the properties we expect our document to include
interface Model {
  count: number
}

export default Counter extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      count: Content.number(doc.count, 0), // Content.number ensures that doc.count is a number, and provides 0 as a default
    }
  }


  show({count}: Doc<Model>) {
    return (
      <button onClick={this.click}>{count}</button>
    )
  }

  click = () => {
    this.change(doc => {
      doc.count += 1
    })
  }
}

Content.register("Counter", Counter) // Register the widget with Content, so other components can render it.
```

## Footnotes

[<a name="footnote1">1</a>]: `mode` is intended to give the widget a general
sense of what it can expect about the context it is rendering into. For example,
a widget receiving `"fullscreen"` can expect that it is (almost) the only thing
rendered on the screen. The widget might then show additional controls, or enable
a richer set of gestures.

Similarly, `"preview"` is informing the widget that it is being rendered as a
preview and will not receive user input events. The widget might hide
interactive controls in this mode.

`mode` is not explicitly saying anything about the _size_ of the widget, which
will likely be provided via a separate prop.
