const { argv } = require("yargs")
import * as fs from "fs"

const { workspace, id: botId } = argv
const fileName = argv._[0]

if (!workspace || !botId || !fileName || !fs.existsSync(fileName)) {
  console.log(
    "Usage: ./make-bot --workspace workspaceId --id botId bot-code.js",
  )
  process.exit(0)
}

const code = fs.readFileSync(fileName, "utf-8")

const raf = require("random-access-file")
import { Doc } from "automerge/frontend"
import { last, once } from "lodash"

import * as Link from "../../data/Link"
import Store from "../../data/Store"
import StoreBackend from "../../data/StoreBackend"

import CloudClient from "../../modules/discovery-cloud/Client"
import { FrontendHandle } from "../../modules/hypermerge/frontend"
import { Hypermerge } from "../../modules/hypermerge"

import "../../components/Bot"
import * as Board from "../../components/Board"
import * as DataImport from "../../components/DataImport"
import * as Workspace from "../../components/Workspace"
import Content from "../../components/Content"

const hm = new Hypermerge({ storage: raf })
const storeBackend = new StoreBackend(hm)
Content.store = new Store()

storeBackend.sendQueue.subscribe(msg => Content.store.onMessage(msg))
Content.store.sendQueue.subscribe(msg => storeBackend.onMessage(msg))

hm.joinSwarm(
  new CloudClient({
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
    id: hm.id,
    stream: hm.stream,
  }),
)

hm.ready.then(hm => {
  Content.open(workspace, (workspace: Doc<Workspace.Model>) => {
    const boardUrl =
      workspace.navStack.length > 0
        ? last(workspace.navStack)
        : workspace.rootUrl

    if (!boardUrl) {
      console.log("Can't find a board, exiting...")
      return
    }

    console.log(`Using board: ${boardUrl}`)

    const boardHandle = Content.open(boardUrl, (doc: any) => {
      const botExists = !!doc.cards[botId]

      console.log("board doc", doc)

      if (botExists) {
        // update
        const botHandle = Content.open(doc.cards[botId].url, (doc: any) => {
          console.log("bot doc", doc)
        })

        botHandle(bot => {
          bot.code = code
        })
      } else {
        // create
        const botUrl = Content.create("Bot")

        const botHandle = Content.open(botUrl, (doc: any) => {
          console.log("bot doc", doc)
        })

        botHandle(doc => {
          doc.id = botId
          doc.code = code
        })

        boardHandle((board: Doc<Board.Model>) => {
          const card = {
            id: botId,
            z: 0,
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            url: botUrl,
          }

          board.cards[botId] = card
        })
      }
    })
  })
})
