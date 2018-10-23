const last = arr => arr[arr.length - 1]

const MARGIN = 20
const WINDOW_HEIGHT = window.innerHeight

Content.open(Content.workspaceUrl, workspace => {
  const boardUrl =
    workspace.navStack.length > 0 ? last(workspace.navStack) : workspace.rootUrl

  const changeBoard = Content.open(boardUrl, () => {})

  changeBoard(doc => {
    const nonBotCards = Object.values(doc.cards).filter(
      card => card.url.indexOf("Bot") < 0,
    )

    console.log({ nonBotCards })

    const avgWidth =
      nonBotCards.reduce((memo, card) => card.width + memo, 0) /
      nonBotCards.length

    let column = 0
    let topOffset = 0

    nonBotCards.forEach(card => {
      const aspect = card.width / card.height

      card.width = avgWidth
      card.height = avgWidth / aspect

      if (topOffset + card.height + MARGIN * 2 > WINDOW_HEIGHT) {
        column++
        topOffset = 0
      }

      card.x = column * (avgWidth + MARGIN) + MARGIN
      card.y = topOffset + MARGIN

      topOffset = card.y + card.height
    })
  })
})
