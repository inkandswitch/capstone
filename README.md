# Capstone

Capstone is an experimental tool for organizing your thoughts.

It was developed by [Ink & Switch](https://inkandswitch.com).


## Overview

Quick overview here.

More context is available in the
[Capstone blog post](https://inkandswitch.com/capstone).


## Usage

Here's how to use Capstone.

For the full experience, you'll need a Google Pixelbook tablet with a stylus,
plus a desktop / laptop (anything should work). Later we describe how to run a
degraaded version with less hardware.

### Installing

On each of your tablet and desktop, clone into `capstone` and run:

```console
$ yarn install
$ yarn start
```

Again on each device, open Chrome and go to `chrome://extensions`. Select "Load
unpacked". Select `capstone/dist/capstone`

You should then be able to open Sidecar on your desktop and Capstone on your
tablet as you would other apps on those platforms.

When the data format changes, you may need to "Remove" the apps from
`chrome://extensions` and re-install them, clearing your data in the process.

To pair your desktop sidecar with your tablet app, get a console in your tablet
app (long-press, "Inspect"), and then type:

### Linking

```js
> chrome.storage.local.get('workspaceUrl', console.log)
{workspaceUrl: "capstone://Workspace/..."}
```

Send this URL to your desktop out of band. Open your desktop sidecar, paste the
URL into given form, and hit Enter.


### Using

The seperate [cheatsheet](Cheatsheet.md) describes all the features you can
use in the app.


## Hacking

This sections describes how to develop the Capstone source.

### Dev tools

- `yarn start`: Start the development build
- `yarn dev`: Run `yarn install` and then build once in development mode
- `yarn build`: Run `yarn install` and then build once in production mode
- `yarn build --env.only=capstone`: Run the build for only the capstone app. Also works with `yarn start` and `yarn dev`
- `yarn clean`: Delete `dist/*` for a clean build
- `yarn test`: Same as `yarn tests`
- `yarn repl`: Start a TypeScript REPL
- `yarn format`: Format all `src/*` code with prettier
- `yarn capstone`: Open the "capstone" chrome app. Run `yarn start` first
- `yarn sidecar`: Open the "sidecar" chrome app. Run `yarn start` first
- `yarn tests`: Open the "tests" chrome app. Run `yarn start` first

We're using [`prettier`](https://prettier.io/) for code formatting.
It should be recommended in the extensions tab of VSCode, and there is
support for [other editors](https://prettier.io/docs/en/editors.html) as well.
Otherwise, you can format the code by running `yarn format`.

### Widgets

Widgets are React components that handle the rendering and construction of a document.

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
import * as React from "react"
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

### Pixelbook Notes

- The linux container in ChromeOS (crostini) is inside a local LAN. Some ports are forwarded by default: `3000, 4200, 5000, 8000, 8008, 8080, 8085, 8888, 9005`

### Debug Tools

In the developer console for the backend process some debug tools are available
type

```
  > peek()
```

To see the documents being track by the backend

```
  > peek(docid)
```

To get more info on a single doc

```
  > peek(docid,"p")
```

To get more info on peers and network activity

### Footnotes

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
