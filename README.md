# Capstone

Capstone is an experimental tablet+stylus device for creative professionals to
develop their ideas. We used it as a playground to explore questions about
digital tools for thinking and explaining, how to bring together desktop and
touch interface metaphors, and what a power user might want from their digital
tools in the coming five to ten years.

It was developed by [Ink & Switch](https://inkandswitch.com) as part of our
research in this area. While we're no longer developing Capstone, we learned a
lot and wanted to share the code publically.


## Overview

Briefly, Capstone works as follows:

* You bring data into app - web pages, text snippets, and images - via a Chrome
  extension
* You organize your data visually on boards in the Capstone tablet app
* You can additionally write on boards for e.g. free-form notes and drawings

[Screenshot]


## Usage

The easiest way to get started is with a ChromeOS tablet device, such as the
[Google Pixelbook](https://store.google.com/product/google_pixelbook). Install
these two apps on your ChromeOS tablet from the Chrome Web Store:

* [Capstone](https://chrome.google.com/webstore/detail/capstone/gcdcngjcmfebohcjojfbfkmpenlfjcfc)
* [Capstone Clipper](https://chrome.google.com/webstore/detail/degnaliianmmgfglcggahlojkkacjimh)

Then open the Capstone app and use the Capstone Clipper extension in
Chrome to bring in content.

The [cheatsheet](Cheatsheet.md) describes how to use the app in detail.

It's possible to run degraded versions of Capstone on other devices - see
Hacking below.


## Hacking

### Linux Subsystem for ChromeOS

### Building

On each of your tablet and desktop, clone into `capstone` and run:

```console
$ yarn install
$ yarn dev
```

Again on each device, open Chrome and go to `chrome://extensions`. Select "Load
unpacked" and choose `capstone/dist/capstone`, then again for
`capstone/dist/clipper`.

This should install "Capstone" as an app and "Capstone Clipper" as a Chrome
extension on each device.

To pair your desktop sidecar with your tablet app, get a console in your tablet
app (long-press, "Inspect"), and then type:

### Linking

You'll want to link the app on your tablet with the one on your desktop. On
your tablet, press right-shift to open the debug panel and click "copy" to copy
the workspace URL. Send this to your desktop out of band (e.g. via email). On
your desktop, put this URL into your OS clipboard, open the Capstone app, and
then paste the URL.

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

## License

Released under the [MIT license](https://opensource.org/licenses/MIT).

## Credits

Capstone was created in 2018 by Adam Wiggins, Orion Henry, Peter van Hardenberg, Mark McGranaghan, Gokcen Keskin, Jeff Peterson, Julia Roggatz, and Matt Tognett; with contributions from James Lindenbaum, Martin Kleppmann, and Szymon Kaliski.
