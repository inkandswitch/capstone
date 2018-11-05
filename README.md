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

- You bring data into app - web pages, text snippets, and images - via a Chrome
  extension
- You organize your data visually on boards in the Capstone tablet app
- You can additionally write on boards for e.g. free-form notes and drawings

A screenshot showing the app in a trip planning use case:

![Screenshot](https://github.com/inkandswitch/capstone/blob/master/screenshot.png?raw=true)

## Usage

The easiest way to get started is with a ChromeOS tablet device, such as the
[Google Pixelbook](https://store.google.com/product/google_pixelbook). Install
these two apps on your ChromeOS tablet from the Chrome Web Store:

- [Capstone](https://chrome.google.com/webstore/detail/capstone/gcdcngjcmfebohcjojfbfkmpenlfjcfc)
- [Capstone Clipper](https://chrome.google.com/webstore/detail/degnaliianmmgfglcggahlojkkacjimh)

Then open the Capstone app and use the Capstone Clipper extension in
Chrome to bring in content.

The [cheatsheet](Cheatsheet.md) describes how to use the app in detail.

It's possible to run degraded versions of Capstone on other devices - see below.

## Hacking

### On ChromeOS

You can develop Capstone directly on ChromeOS tablets using the experimental
Linux subsystem.

Linux is not yet included by default, so first install it according to
[these instructions](https://developer.android.com/topic/arc/studio#install_linux).

Open the Terminal app and install NodeJS and Yarn. For example:

```console
$ curl -sL https://nodejs.org/dist/v10.8.0/node-v10.8.0-linux-x64.tar.xz > nodejs.tar.xz
$ tar xJvf nodejs.tar.xz
$ export PATH=$HOME/node-v10.8.0-linux-x64/bin:$PATH
$ echo 'export PATH=$HOME/node-v10.8.0-linux-x64/bin:$PATH' >> ~/.bashrc
$ npm install -g yarn
```

Then proceed to "Building from source" below.

### On other devices

You'll need access to a standard NodeJS+Yarn install and a command line, but
otherwise the instructions in "Building from source" below should work fine. See
also "Pairing" on how to use two devices (e.g. a ChromeOS tablet and regular
desktop) at the same time.

Note that running the main Capstone on something other than a ChromeOS tablet
(including non-ChromeOS tablets like the Surface), will result in a degraded
and/or buggy experience. But the clipper should work fine anywhere, and even
the degraded app can be useful in development.

### Building from source

Clone into `capstone` on your development machine (ChromeOS tablet or otherwise)
and run:

```console
$ yarn install
$ yarn dev
```

Build artifacts are emitted to `dist/capstone` and `dist/clipper` for the main
app and the web clipper extension, respectively.

To install these artifacts, open Chrome, navigate to `chrome://extensions`, and
select "Load unpacked". Choose `dist/capstone`, then do this again for
`dist/clipper`. This should install "Capstone" as an app and "Capstone Clipper"
as a Chrome extensions on that device.

You'll need to do this on each device you want to use.

### Pairing

You can link a desktop and tablet app together for a smoother workflow. In
particular you may want to capture data from your desktop in the course of
normal web browsing, but read/organize/sketch on your tablet.

Do this, first on your tablet open the Capstone app, press right-shift to
open the debug panel, and click "copy" to copy the workspace URL. Send this to
your desktop out of band (e.g. via email). On your desktop, open the Capstone
app and then paste the URL.

Once that's done, you can e.g. add files to the desktop app and see them
instantly appear on your tablet, or clip web pages from your desktop and see
them show up on the tablet.

### Cloud server

Capstone uses a rendezvous-style cloud server to implement discovery and
"peer-to-peer" messaging. (This was a workaround for technical issues we
experienced with a true peer-to-peer stack.) By default, installs of the
app use a shared cloud server we run on Heroku.

You can alternatly deploy your own cloud server:

```console
$ TODO
```

To configure an instance of your Capstone app to use a custom cloud server,
instead of the default one:

```console
$ TODO
```

### Dev tools

Useful commands:

- `yarn start`: Start the development build
- `yarn dev`: Run `yarn install` and then build once in development mode
- `yarn build`: Run `yarn install` and then build once in production mode
- `yarn build --env.only=capstone`: Run the build for only the capstone app.
  Also works with `yarn start` and `yarn dev`
- `yarn clean`: Delete `dist/*` for a clean build
- `yarn test`: Same as `yarn tests`
- `yarn repl`: Start a TypeScript REPL
- `yarn cloud`: Run a development cloud server on localhost
- `yarn format`: Format all `src/*` code with prettier
- `yarn capstone`: Open the "capstone" Chrome app. Run `yarn start` first
- `yarn clipper`: Open the "clipper" Chrome app. Run `yarn start` first
- `yarn tests`: Open the "tests" Chrome app. Run `yarn start` first

### Code formatting

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

Given a document URL, a widget can be rendered using `Content`:

```typescript
<Content url={url} mode="preview" />
```

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

### Actors

The capstone project contains a partially implemented “Actor” system. Actors
are a means of manipulating documents independent of the React/UI hiearchy
(for the most part - Widget components can send messages to Actors). Actors
send and receive messages which have a "topic" and are addressed to specific
documents. Actors are generally implemented per-plugin and provide plugin-
specific logic for manipulating documents. For example, the `BoardActor`
provided by the `Board` plugin will handle a `ReceiveDocuments` message by
adding those documents to a board as card.

Widgets can communicate with the Actor system via their `emit` prop. `emit`
acts as a pre-addressed message `send` function - all messages sent from the
Widget are automatically addressed to the Widget’s own document and sent to the
Actor provided by the widget’s plugin.

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

Capstone was created in 2018 by Adam Wiggins, Orion Henry, Peter van Hardenberg,
Mark McGranaghan, Gokcen Keskin, Jeff Peterson, Julia Roggatz, and Matt Tognett;
with contributions from James Lindenbaum, Martin Kleppmann, and Szymon Kaliski.
