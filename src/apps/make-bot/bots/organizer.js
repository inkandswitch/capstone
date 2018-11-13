const last = arr => arr[arr.length - 1]

const cleanUp = () => {
  // constants for gallery
  const MARGIN = 20
  const WINDOW_HEIGHT = window.innerHeight

  // open workspace
  Content.open(Content.store.getWorkspace())
    .once(workspace => {
      // grab a board
      const boardUrl =
        workspace.navStack.length > 0
          ? last(workspace.navStack).url
          : workspace.rootUrl

      Content.change(boardUrl, board => {
        // all cards that are not a bot
        const nonBotCards = Object.values(board.cards).filter(
          card => card.url.indexOf("Bot") < 0,
        )

        // calculate average width of a card
        const avgWidth =
          nonBotCards.reduce((memo, card) => card.width + memo, 0) /
          nonBotCards.length

        // some imperative code to arrange in columns
        let column = 0
        let topOffset = 0

        nonBotCards.forEach(card => {
          // update card aspect ratio
          const aspect = card.width / card.height
          card.width = avgWidth
          card.height = avgWidth / aspect

          // move to new column if needed
          if (topOffset + card.height + MARGIN * 2 > WINDOW_HEIGHT) {
            column++
            topOffset = 0
          }

          // update x & y pos
          card.x = column * (avgWidth + MARGIN) + MARGIN
          card.y = topOffset + MARGIN

          // store offset
          topOffset = card.y + card.height
        })
      }).close()
    })
    .close()
}

makeBot("organizer", bot => {
  // and now, instead of working as a button-based action
  // bot.action("Clean Up!", cleanUp)

  // we can make it autonomous!
  bot.autonomous(
    "Board", // act on any change on board
    cleanUp,
  )
})
