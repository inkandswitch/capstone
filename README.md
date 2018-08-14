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
- `view` is a string enum informing the widget how it's expected to render. Possible values are:
  - `"default"` is how the widget is rendered on the board.
  - `"preview"` is about the same as a card on the board, but should not be interactive.

### Using a widget

Given a document URL, a widget can be rendered using `Content`:

```typescript
<Content url={url} view="preview" />
```

### Building a widget

Every widget must implement a `static decode(doc)` method which translates a
free-form document which you hope contains your data into a definitive data
structure you can render. The decode method helps to guarantee that later in
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
  static decode(doc: AnyDoc): Model {
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
