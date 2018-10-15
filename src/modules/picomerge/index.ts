

// WHY
// 1. typescript
// 2. constructor/open/create is syncronous - almost all api calls are syncronous 
// 3. much much smaller codebase (1700 loc vs 500 loc)
// 4. first document emitted is all of whats on disk
// 5. no efficiency issues with massive numbmers of documents (just need to read the metadata feed is all)
// 6. on download - emits only once when download of a feed is complete on(sync)
// 7. does not emit two docs on change
// 8. does not allocate a hypercore for a document unless you intend to write to it (read only mode)
// 9. exports almost the same interface as hypermerge

const EXT = "picomerge"

type FeedFn = (f:Feed<Change>) => void
type Mode = "r" | "w"

interface Swarm {
  join(dk: Buffer) : void
  leave(dk: Buffer) : void
  on: Function
}

import Queue from "../../data/Queue"
import * as Base58 from "bs58"
import * as crypto from "hypercore/lib/crypto"
import { hypercore, Feed, Peer, discoveryKey } from "./hypercore"
import * as Backend from 'automerge/backend'
import { Change, Patch, BackDoc } from 'automerge/backend'
import { BackendHandle } from  "./backend"
import { FrontendHandle } from  "./frontend"
import * as Debug from "debug"

Debug.formatters.b = Base58.encode

const HypercoreProtocol : Function = require('hypercore-protocol')
const ram : Function = require('random-access-memory')
const raf : Function = require('random-access-file')
const swarm : Function = require('discovery-swarm')
const swarmDefaults : any = require("dat-swarm-defaults")
const toBuffer : Function = require('to-buffer')
const log = Debug("picomerge")

export interface Keys {
  publicKey: Buffer
  secretKey?: Buffer
}

export interface FeedData {
  actorId: string
  writable: Boolean
  changes: Change[]
}

export interface Options {
  path: string
  storage?: Function
}

export interface LedgerData {
  docId: string
  actorIds: string[]
}

export class Picomerge {
  path?: string
  storage : Function
  ready : Promise<undefined>
  joined : Set<Buffer> = new Set()
  feeds : Map<string,Feed<Change>> = new Map()
  feedQs : Map<string,Queue<FeedFn>> = new Map()
  feedPeers : Map<string,Set<Peer>> = new Map()
  docs : Map<string,BackendHandle> = new Map()
  ledger : Feed<LedgerData>
  docMetadata : Map<string,string[]> = new Map() // Map of Sets - FIXME
  swarm? : Swarm
  id: Buffer

  constructor (opts : Options)  {
    this.path = opts.path
    this.storage = opts.storage || (opts.path ? raf : ram)
    this.ledger = hypercore(this.storageFn("ledger"), {valueEncoding: 'json'})
    this.id = this.ledger.id
    this.ready = new Promise((resolve,reject) => {
      this.ledger.ready(() => {
        log("Ledger ready: size", this.ledger.length)
        if (this.ledger.length > 0) {
          this.ledger.getBatch(0, this.ledger.length, (err ,data) => {
            data.forEach(d  => {
              let old = this.docMetadata.get(d.docId) || []
              this.docMetadata.set(d.docId, old.concat(d.actorIds))
            })
            resolve()
          })
        } else {
          resolve()
        }
      })
    })
  }

  createDocumentPair<T> ( keys : Keys ) : [ BackendHandle, FrontendHandle<T> ] {
    const back = this.createDocument(keys)
    const front = new FrontendHandle<T>(back.docId, "w")
    front.init(back.docId)
    front.on("requests", back.applyLocalChanges)
    back.on("patch", front.patch)
    back.on("localpatch", front.localPatch)
    return [ back, front ]
  }

  createDocument ( keys : Keys ) : BackendHandle {
    const docId = Base58.encode(keys.publicKey)
    log("Create",docId)
    const dk = discoveryKey(keys.publicKey)
    const doc = new BackendHandle(this, docId, Backend.init())

    this.docs.set(docId, doc)

    this.initFeed(doc, keys)

    return doc
  }

  private addMetadata(docId : string, actorId : string) {
    this.ready.then(() => {
      let ld : LedgerData = { docId: docId, actorIds: [actorId] }
      let old = this.docMetadata.get(docId) || []
      if (!old.includes(actorId)) {
        this.docMetadata.set(docId, old.concat(ld.actorIds))
        this.ledger.append(ld)
      }
    })
  }

  openDocument (docId : string, mode: Mode) : BackendHandle {
    let doc = this.docs.get(docId) || new BackendHandle(this, docId)
    if (!this.docs.has(docId)) {
      this.docs.set(docId,doc)
      this.addMetadata(docId, docId)
      this.loadDocument(doc, mode)
      this.join(docId)
    }
    return doc
  }

  openDocumentPair<T> ( docId: string, mode: Mode) : [ BackendHandle, FrontendHandle<T> ] {
    const back = this.openDocument(docId, mode)
    const front = new FrontendHandle<T>(back.docId, mode)
    front.on("requests", back.applyLocalChanges)
    back.on("ready", front.init)
    back.on("patch", front.patch)
    back.on("localpatch", front.localPatch)
    return [ back, front ]
  }

  joinSwarm( swarm: Swarm ) {
    if (this.swarm) { throw new Error("joinSwarm called while already swarming") }
    this.swarm = swarm
    for (let dk of this.joined) {
      this.swarm.join(dk)
    }
  }

  private feedData (doc : BackendHandle, actorId : string) : Promise<FeedData> {
    console.log("FEED DATA",actorId)
    return new Promise((resolve, reject ) => {
      this.getFeed(doc, actorId, feed => {
        const writable = feed.writable
        console.log("FEED",actorId, feed.length, feed.writable)
        if (feed.length > 0) {
          feed.getBatch(0, feed.length, (err, changes) => {
            if (err) { reject(err) }
            resolve({actorId, writable, changes })
          })
        } else {
          resolve({actorId, writable, changes:[]})
        }
      })
    })
  }

  private allFeedData (doc : BackendHandle) : Promise<FeedData[]> {
    return Promise.all(doc.actorIds().map(key => this.feedData(doc,key)))
  }

  writeChange (doc : BackendHandle, actorId: string, changes : Change) {
    this.getFeed(doc, actorId, feed => {
      feed.append(changes, err => {
        if (err) {
          throw new Error("failed to append to feed")
        }
      })
    })
  }

  private loadDocument (doc : BackendHandle, mode: Mode) {
    return this.ready.then(() => this.allFeedData(doc).then(feedData => {
      const writer = feedData.filter(f => f.writable).map(f => f.actorId).shift()
      const changes = ([] as Change[]).concat(...feedData.map(f => f.changes))
      doc.init(changes, mode === "w" ? writer || this.initActorFeed(doc) : undefined)
    }))
  }

  private join (actorId : string ) {
    const dk = discoveryKey(Base58.decode(actorId))
    if (this.swarm && !this.joined.has(dk)) {
      this.swarm.join(dk)
    }
    this.joined.add(dk)
  }

  private leave (actorId : string) {
    const dk = discoveryKey(Base58.decode(actorId))
    if (this.swarm && this.joined.has(dk)) {
      this.swarm.leave(dk)
    }
    this.joined.delete(dk)
  }

  private getFeed = (doc : BackendHandle, actorId : string, cb : FeedFn) => {
    const publicKey = Base58.decode(actorId)
    const dk = discoveryKey(publicKey)
    const dkString = Base58.encode(dk)
    const q = this.feedQs.get(dkString) || this.initFeed(doc, { publicKey })
    q.push(cb)
  }

  private storageFn (path : string) : Function {
    return (name: string) => {
      return this.storage(this.path + "/" + path + "/"+ name)
    }
  }

  private initActorFeed (doc: BackendHandle) : string {
    const keys = crypto.keyPair()
    const actorId = Base58.encode(keys.publicKey)
    this.initFeed(doc, keys)
    return actorId
  }

  private initFeed (doc: BackendHandle, keys: Keys) : Queue<FeedFn> {
    const { publicKey, secretKey } = keys
    const actorId = Base58.encode(publicKey)
    const storage = this.storageFn(actorId)
    const dk = discoveryKey(publicKey)
    const dkString = Base58.encode(dk)
    const feed : Feed<Change> = hypercore(storage, publicKey, { valueEncoding: 'json', secretKey })
    const q = new Queue<FeedFn>()
    const peers = new Set()
    this.feeds.set(dkString, feed)
    this.feedQs.set(dkString, q)
    this.feedPeers.set(actorId, peers)
    this.addMetadata(doc.docId, actorId)
    feed.ready(() => {
      this.join(actorId)
      feed.on("peer-remove", (peer: Peer) => {
        peers.delete(peer)
      })
      feed.on("peer-add", (peer: Peer) => {
        peer.stream.on("extension", (ext:string,buf:Buffer) => {
          const msg : string[] = JSON.parse(buf.toString())
          if (ext === EXT) {
            // getFeed -> initFeed -> join()
            msg.forEach(actorId => this.getFeed(doc, actorId, (_) => {}))
          }
        })
        peers.add(peer)
        peer.stream.extension(EXT, Buffer.from(JSON.stringify(doc.actorIds())))
      })

      let remoteChanges : Change[] = []
      feed.on("download", (idx, data) => {
        remoteChanges.push(JSON.parse(data))
      })
      feed.on("sync", () => {
        doc.applyRemoteChanges(remoteChanges)
        remoteChanges = []
      })

      this.feedQs.get(dkString)!.subscribe(f => f(feed))

      feed.on("close", () => {
        log("closing feed", actorId)
        this.feeds.delete(dkString)
        this.feedQs.delete(dkString)
        this.feedPeers.delete(actorId)
      })
    })
    return q
  }

  stream = (opts:any) : any => {
    log("stream",opts)
    const stream = HypercoreProtocol({
      live: true,
      id: this.ledger.id,
      encrypt: false,
      extensions: [EXT]
    })

    let add = (dk:Buffer) => {
      const feed = this.feeds.get(Base58.encode(dk))
      if (feed) {
        log("replicate feed!",Base58.encode(dk));
        feed.replicate({
         stream,
         live: true
        })
      }
    }

    stream.on('feed', (dk: Buffer) => add(dk))

    add(opts.channel || opts.discoveryKey)

    return stream
  }

  releaseHandle (handle: BackendHandle) {
    throw new Error("unimplemented")
  }
}

