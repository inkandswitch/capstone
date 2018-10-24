const last = arr => arr[arr.length - 1]

const once = fn => {
  let fired = false

  return (...args) => {
    if (!fired) {
      const result = fn(...args)

      fired = true
      fn = undefined

      return result
    }

    return undefined
  }
}

const addTimestamp = type => {
  const url = Content.create("Text")

  const change = Content.open(url, () => {})

  change(
    once(doc => {
      doc.content =
        type === "date"
          ? new Date().toDateString().split("")
          : new Date().toTimeString().split("")
    }),
  )

  Content.open(
    Content.workspaceUrl,
    once(workspace => {
      const boardUrl =
        workspace.navStack.length > 0
          ? last(workspace.navStack)
          : workspace.rootUrl

      const changeBoard = Content.open(boardUrl, () => {})

      const id = UUID.create()

      const card = {
        id,
        x: 50,
        y: 50,
        z: 100, // lazy, should take board.topZ
        width: type === "date" ? 200 : 400,
        height: 40,
        url,
      }

      changeBoard(
        once(doc => {
          doc.cards[id] = card
        }),
      )
    }),
  )
}

makeBot("journaling", bot => {
  bot.action("Add time", () => {
    addTimestamp("time")
  })

  bot.action("Add date", () => {
    addTimestamp("date")
  })
})
