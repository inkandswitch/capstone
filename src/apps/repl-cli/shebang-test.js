#!./capstone-shebang

// this is just a sketch, not a working code!
cli.connect(process.argv[2]).then(cli => {
  // there's a distinction between what's executed on host machine vs on
  // capstone, we have to solve it if we want scripts, this is especially
  // painful since we might want to pass some args from host machine, but have
  // them executed in capstone instance

  cli.execute(`
    Content.once(Content.rootBoardUrl, change => {
      change(doc => {
        Object.keys(doc.cards).forEach(key => {
          const snap = 100
          doc.cards[key].x = Math.round(doc.cards[key].x / snap) * snap
          doc.cards[key].y = Math.round(doc.cards[key].y / snap) * snap
        })

        return doc
      })
    })
  `)
})
