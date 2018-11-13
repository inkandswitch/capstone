const last = arr => arr[arr.length - 1]

const addTimestamp = type => {
  const url = Content.create("Text")

  Content.change(url, doc => {
    doc.content =
      type === "date"
        ? new Date().toDateString().split("")
        : new Date().toTimeString().split("")
  })

  Content.open(Content.store.getWorkspace()).once(workspace => {
    const boardUrl =
      workspace.navStack.length > 0
        ? last(workspace.navStack).url
        : workspace.rootUrl

    const id = UUID.create()

    const card = {
      id,
      x: 50,
      y: 50,
      z: 100,
      width: type === "date" ? 200 : 400,
      height: 40,
      url,
    }

    Content.open(boardUrl).change(doc => {
      doc.cards[id] = card
    })
  })
}

makeBot("journaling", bot => {
  bot.action("Add time", () => {
    addTimestamp("time")
  })

  bot.action("Add date", () => {
    addTimestamp("date")
  })
})
