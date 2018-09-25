const EventEmitter = require("events")
const Backend = require("automerge/backend")
const Frontend = require("automerge/frontend")
const Multicore = require("./multicore")
const discoverySwarm = require("discovery-swarm")
const swarmDefaults = require("dat-swarm-defaults")
const Debug = require("debug")
const Base58 = require("bs58")

const log = Debug("hypermerge:index")

function ERR(str) {
  throw new Error(str)
}

// The first block of each Hypercore feed is used for metadata.
const START_BLOCK = 1

// One piece of metadata every feed will have indicates that the feed is
// managed by Hypermerge.
const METADATA = {
  hypermerge: 1,
}

class DocHandle {
  constructor(hm, docId, doc) {
    this.hm = hm
    this.docId = docId
    this.actorId = doc ? doc.get("actorId") : null
    this._back = doc || null
    this._front = null
    this._isManagingFront = false
    this._ondoc = () => {}
    this._onpatch = () => {}
    this._pending_front = []
    this._pending_back = []
  }

  applyChanges(changes) {
    if (this._back) {
      this.hm.applyChanges(this.docId, changes, true)
    } else {
      this._pending_back.push(changes)
    }
  }

  toString(cb, spaces = null) {
    if (this._back) {
      return JSON.stringify(this._front ||  Frontend.applyPatch(Frontend.init("_"), Backend.getPatch(this._back)), undefined, spaces)
    } else {
      return 'null'
    }
  }

  onPatch(cb) {
    this._onpatch = cb
    if (this._back) {
      cb(this._uberPatch())
    }
  }

  onChange(cb) {
    this._ondoc = cb
    this._isManagingFront = true
    this._setupFront()
  }

  change(fn) {
    this._isManagingFront = true
    this._setupFront()
    if (this._front) {
      this._applyFN(fn)
    } else {
      this._pending_front.push(fn)
    }
  }

  release() {
    this.hm.releaseHandle(this)
  }

  // internals

  _applyFN(fn) {
    this._front = Frontend.change(this._front, fn)
    this.applyChanges(Frontend.getRequests(this._front))
    return this._front
  }

  _setupFront() {
    if (this._back && !this._front && this._isManagingFront) {
      this._front = Frontend.init(this.actorId)
      this._applyPatch(this._uberPatch())
      this._pending_front.forEach(fn => this._applyFN(fn))
      this._pending_front = []
    }
  }

  _uberPatch() {
    // memoize for speed?
    return Backend.getPatch(this._back)
  }

  _applyPatch(patch) {
    if (this._front && patch.diffs.length > 0) {
      this._front = Frontend.applyPatch(this._front, patch)
      this._ondoc(this._front)
    }
  }

  _update(back, patch) {
    this._back = back
    this._onpatch(patch)
    this._applyPatch(patch)
  }

  _update_back_only(back) {
    let oldBack = this._back
    this._back = back
    this._onpatch(patch)
    this._applyPatch(patch)
  }

  _ready(back) {
    this._back = back
    this._front = null
    this.actorId = back.get("actorId")

    this._onpatch(this._uberPatch())

    this._setupFront()

    this._pending_back.map(changes => this.applyChanges(changes))
    this._pending_back = []
  }

  // message stuff

  message(message) {
    if (this.hm.readyIndex[this.docId]) {
      this.hm.message(this.docId, message)
    }
  }

  onMessage(cb) {
    this._messageCb = cb
    return this
  }

  _message({ peer, msg }) {
    if (this._messageCb) {
      this._messageCb({ peer, msg })
    }
  }
}

function initHypermerge(ops, cb) {
  let doc = new Hypermerge(ops)
  doc.ready.then(cb)
}

class Hypermerge extends EventEmitter {
  constructor({ storage, defaultMetadata = {} }) {
    super()

    this.defaultMetadata = defaultMetadata

    this.feeds = {}
    this.docs = {}
    this.handles = {} // docId -> [DocHandle]
    this.readyIndex = {} // docId -> Boolean
    this.groupIndex = {} // groupId -> [actorId]
    this.docIndex = {} // docId -> [actorId]
    this.metaIndex = {} // actorId -> metadata
    this.requestedBlocks = {} // docId -> actorId -> blockIndex (exclusive)
    this.appliedSeqs = {} // actorId -> seq -> Boolean

    this.core = new Multicore(storage)

    this.ready = new Promise(resolve => {
      this.core.on("ready", () => {
        this._initFeeds(this._feedKeys(), resolve)
      })
    })
  }

  _feedKeys() {
    return this.core.feedKeys().map(Base58.encode)
  }

  chromeJoinSwarm() {
    const MDNS_PORT = 5307
    const dgram = require("chrome-dgram")
    const socket = dgram.createSocket("udp4")
    const mdns = require("multicast-dns")

    socket.setMulticastTTL(255)
    socket.setMulticastLoopback(true)

    chrome.system.network.getNetworkInterfaces(ifaces => {
      socket.on("listening", () => {
        for (let i = 0; i < ifaces.length; i++) {
          if (ifaces[i].prefixLength == 24) {
            socket.addMembership("224.0.0.251", ifaces[i].address)
          }
        }
        const multicast = mdns({
          socket,
          bind: false,
          port: MDNS_PORT,
          multicast: false,
        })
        this.joinSwarm({
          dht: false,
          dns: { multicast },
        })
      })
      socket.bind(MDNS_PORT)
    })
  }

  joinSwarm(opts = {}) {
    if (opts.chrome === true) {
      return this.chromeJoinSwarm()
    }

    log("joinSwarm")

    if (opts.port == null) opts.port = 0

    let mergedOpts = Object.assign(
      swarmDefaults(),
      {
        hash: false,
        encrypt: true,
        stream: opts => this.replicate(opts),
      },
      opts,
    )

    // need a better deeper copy
    mergedOpts.dns = Object.assign(swarmDefaults().dns, opts.dns)

    this.swarm = discoverySwarm(mergedOpts)

    this.swarm.join(this.core.archiver.changes.discoveryKey)

    Object.values(this.feeds).forEach(feed => {
      this.swarm.join(feed.discoveryKey)
    })

    this.core.archiver.on("add", feed => {
      this.swarm.join(feed.discoveryKey)
    })

    this.core.archiver.on("remove", feed => {
      this.swarm.leave(feed.discoveryKey)
    })

    this.swarm.listen(opts.port)

    this.swarm.once("error", err => {
      log("joinSwarm.error", err)
      this.swarm.listen(opts.port)
    })

    return this
  }

  /**
   * Returns the document for the given docId.
   * Throws if the document has not been opened yet.
   */
  find(docId) {
    return (
      this.docs[docId] ||
      ERR(`Cannot find document. open(docId) first. docId: ${docId}`)
    )
  }

  /**
   * Returns the `docId` for the given `doc`. Note that this is id of the logical
   * doc managed by Hypermerge, and not neccisarily the Automerge doc id.
   */
  getId(doc) {
    return this._actorToId(this._getActorId(doc))
  }

  openHandle(docId) {
    docId = cleanDocId(docId)

    log("openHandle", docId)

    this._trackedFeed(docId)

    const doc = this.readyIndex[docId] ? this.docs[docId] : null
    const handle = new DocHandle(this, docId, doc)

    this._handles(docId).push(handle)

    return handle
  }

  releaseHandle(handle) {
    log("releaseHandle", handle)

    const handles = this.handles[handle.id]

    if (!handles) {
      throw new Error(`No handles found for docId: ${handle.id}.`)
    }

    this.handles[handle.id] = handles.filter(h => h !== handle)

    return true
  }

  /**
   * Creates an Automerge document backed by a new Hypercore.
   *
   * If metadata is passed, it will be associated with the newly created document.
   * Some metadata properties are assigned automatically by Hypermerge:
   *  - docId: An id for this document. Forking a document creates a new docId.
   *  - groupId: An id for this group of documents. Forking a document keeps the groupId.
   *
   * @param {object} metadata - metadata to be associated with this document
   */
  create(metadata = {}) {
    log("create")
    return this._create(metadata)
  }

  /**
   * Finds any new changes for the submitted doc for the actor,
   * and appends the changes to the actor's Hypercore feed.
   *
   * @param {Object} doc - document to find changes for
   */

  update(doc) {
    const actorId = this._getActorId(doc)
    const docId = this._actorToId(actorId)
    const pDoc = this.find(docId)

    const changes = Backend.getChanges(pDoc, doc)

    this.applyChanges(docId, changes, true)
  }

  /**
   * Removes Hypercore feed for an actor and Automerge doc.
   *
   * Leaves the network swarm. Doesn't remove files from disk.
   * @param {string} docId
   */
  delete(docId) {
    log("delete", docId)
    const doc = this.find(docId)
    this.core.archiver.remove(Base58.decode(docId))
    delete this.feeds[docId]
    delete this.docs[docId]
    return doc
  }

  /**
   * Returns the list of metadata objects corresponding to the list of actors
   * that have edited this document.
   */
  metadatas(docId) {
    const actorIds = this.docIndex[docId] || []
    return actorIds.map(actorId => this.metadata(actorId))
  }

  /**
   * Returns the metadata object for the given `actorId`.
   */
  metadata(actorId) {
    return this.metaIndex[actorId]
  }

  replicate(opts) {
    return this.core.replicate(opts)
  }

  /**
   * Send the given `msg`, which can be any JSON.stringify-able data, to all
   * peers currently listening on the feed for `actorId`.
   */
  message(actorId, msg) {
    this._trackedFeed(actorId).peers.forEach(peer => {
      this._messagePeer(peer, msg)
    })
  }

  _handles(docId) {
    if (!this.handles[docId]) {
      this.handles[docId] = []
    }
    return this.handles[docId]
  }

  _create(metadata, parentMetadata = {}) {
    const feed = this._trackedFeed()
    const actorId = Base58.encode(feed.key)

    log("_create", actorId)

    // Merge together the various sources of metadata, from lowest-priority to
    // highest priority.
    metadata = Object.assign(
      {},
      METADATA,
      { groupId: actorId }, // default to self if parent doesn't have groupId
      parentMetadata, // metadata of the parent feed to this feed (e.g. when opening, forking)
      this.defaultMetadata, // user-specified default metadata
      { docId: actorId }, // set the docId to this core's actorId by default
      metadata, // directly provided metadata should override everything else
    )
    const { docId } = metadata
    const doc = this._empty(actorId)

    this._appendMetadata(actorId, metadata)
    this._set(docId, doc)
    this._shareDoc(doc)

    return doc
  }

  // Returns the number of blocks available for the feed corresponding to the
  // given `actorId`.
  _length(actorId) {
    return this._feed(actorId).length
  }

  // Returns an empty Automerge document with the given `actorId`. Used as the
  // starting point for building up an in-memory doc for this process.
  _empty(actorId) {
    return Backend.init(actorId)
  }

  // Returns true if the given `actorId` corresponds to a doc with a matching id.
  // This occurs when we this actor originally created the doc.
  _isDocId(actorId) {
    return this._actorToId(actorId) === actorId
  }

  // Returns the logical doc id corresponding to the given `actorId`.
  _actorToId(actorId) {
    const { docId } = this.metadata(actorId)
    return docId
  }

  // Returns our own actorId for the given `doc`.
  _getActorId(doc) {
    return doc.get("actorId")
  }

  // Finds or creates, and returns, a feed that is not yet tracked. See `feed`
  // for cases for `actorId`.
  _feed(actorId = null) {
    const key = actorId ? Base58.decode(actorId) : null

    log("_feed", actorId)
    return this.core.createFeed(key)
  }

  // Finds or creates, and returns, a tracked feed. This means that updates to
  // the feed will cause updates to in-memory docs, emit events, etc.
  //
  // There are three cases:
  // * `actorId` is not given, and we create a new feed with a random actorId.
  // * `actorId` is given but we don't have a feed yet because we just found
  //   out about it from another user - create the feed with the given actorId.
  // * `actorId` is given and we know of the feed already - return from cache.
  _trackedFeed(actorId = null) {
    if (actorId && this.feeds[actorId]) {
      return this.feeds[actorId]
    }

    log("feed.init", actorId)
    return this._trackFeed(this._feed(actorId))
  }

  // Append the given `metadata` for the given `actorId` to the corresponding
  // feed, and also set that metadata in memory.
  _appendMetadata(actorId, metadata) {
    if (this._length(actorId) > 0) {
      throw new Error("Metadata can only be set if feed is empty.")
    }

    this._setMetadata(actorId, metadata)
    this._append(actorId, metadata)
  }

  // App the given `change` to feed for `actorId`. Returns a promise that
  // resolves with no value on completion, or rejects with an error if one occurs.
  _append(actorId, change) {
    log("_append", actorId)
    return this._appendAll(actorId, [change])
  }

  // Append all given `changes` to feed for `actorId`. Returns a promise that
  // resolves with no value on completion, or rejects with an error if one occurs.
  _appendAll(actorId, changes) {
    log("_appendAll", actorId)
    const blocks = changes.map(change => JSON.stringify(change))
    return new Promise((resolve, reject) => {
      this._trackedFeed(actorId).append(blocks, err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  // Track the given `feed`, which must correspond to the given `actorId`,
  // setting up listeners for when peers are added/removed, data is
  // downloaded, etc.
  _trackFeed(feed) {
    const actorId = Base58.encode(feed.key)

    log("_trackFeed", actorId)

    this.feeds[actorId] = feed

    feed.ready(this._onFeedReady(actorId, feed))
    feed.on("peer-add", this._onPeerAdded(actorId))
    feed.on("peer-remove", this._onPeerRemoved(actorId))

    return feed
  }

  // Returns a callback to run when the given `feed`, corresponding to the
  // given `actorId`, is ready.
  // Callback will load metadata for the feed, ensure we have an in-memory
  // doc corresponding to the logical doc of which the feed is a part, set
  // up download callback, and load & apply all existing blocks in the feed
  // plus their dependencies. Finally, it will notify corresponding open
  // handles that the doc is ready.
  _onFeedReady(actorId, feed) {
    return () => {
      log("_onFeedReady", actorId)
      this._loadMetadata(actorId).then(metadata => {
        const docId = this._actorToId(actorId)

        this._createDocIfMissing(docId, actorId)

        feed.on("download", this._onDownload(docId, actorId))

        const ourActorId = this.docs[docId].get("actorId")

        return this._loadBlocksWithDependencies(
          docId,
          actorId,
          this._length(actorId),
        ).then(() => {
          if (actorId !== ourActorId) {
            return
          }

          this.readyIndex[docId] = true
          const doc = this.find(docId)
          this.emit("document:ready", docId, doc)
          this._handles(docId).forEach(handle => {
            handle._ready(doc)
          })
        })
      })
    }
  }

  // Returns true if the Hypercore corresponding to the given actorId is
  // writable. For each doc managed by hypermerge we should have one Hypercore
  // that we created and that's writable by us. The others will not be.
  _isWritable(actorId) {
    return this._feed(actorId).writable
  }

  // Ensures that we have both an in-memory doc and a feed for the given `docId`.
  // We pass `actorId` because the in-memory doc should have our `actorId`, and
  // so we only create it when it's missing and this condition is true. We will
  // need to create the on-disk feed for `docId` when we have a doc shared with
  // us from another user.
  _createDocIfMissing(docId, actorId) {
    if (this.docs[docId]) {
      return
    }

    if (this._isWritable(actorId)) {
      this.docs[docId] = this._empty(actorId)
    }

    const parentMetadata = this.metadata(actorId)

    this._create({ docId }, parentMetadata)
  }

  // Initialize in-memory data structures corresponding to the feeds we already
  // know about. Sets metadata for each feed, and creates and empty doc
  // corresponding to each Hypermerge doc. These docs will later (not here) be
  // updated in memory as we load changes from the corresponding Hypercores
  // from disk and network.
  //
  // Returns a promise that resolves when all this work is complete.
  _initFeeds(actorIds, resolve) {
    log("_initFeeds")

    const promises = actorIds.map(actorId => {
      // Don't load metadata if the feed is empty.
      if (this._length(actorId) === 0) {
        log("_initFeeds.skipEmpty", actorId)
        return Promise.resolve(null)
      }

      return this._loadMetadata(actorId).then(({ docId }) => {
        if (this._isWritable(actorId)) {
          this.docs[docId] = this._empty(actorId)
        }
      })
    })

    return Promise.all(promises).then(() => {
      actorIds.forEach(actorId => this._trackedFeed(actorId))
      this.emit("ready")
      resolve(this)
    })
  }

  // Ensures that metadata for the feed corresponding to `actorId` has been
  // loaded from disk and set in memory. Will only load from disk once as
  // metadata is immutable.
  //
  // Returns a promise resolving to the metadata.
  _loadMetadata(actorId) {
    if (this.metaIndex[actorId]) {
      return Promise.resolve(this.metaIndex[actorId])
    }

    return new Promise((resolve, reject) => {
      this._feed(actorId).get(0, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    }).then(data => this._setMetadata(actorId, JSON.parse(data)))
  }

  // Sets the given `metadata` in memory for the given `actorId`.
  // Does not write to disk: see `_appendMetadata`.
  _setMetadata(actorId, metadata) {
    if (this.metaIndex[actorId]) {
      return this.metaIndex[actorId]
    }

    this.metaIndex[actorId] = metadata
    const { docId, groupId } = metadata

    if (!this.groupIndex[groupId]) {
      this.groupIndex[groupId] = []
    }
    this.groupIndex[groupId].push(actorId)

    if (!this.docIndex[docId]) {
      this.docIndex[docId] = []
    }
    this.docIndex[docId].push(actorId)

    return metadata
  }

  // Loads all blocks for the given `docId` + `actorId`, and applies them
  // to the corresponding in-memory document. Also loads and applies all blocks
  // on which any of those changes depend, recursively.
  //
  // Returns a promise that resolves when this completes.
  //
  // NOTE: RACE!!
  _loadBlocksWithDependencies(docId, actorId, last) {
    const first = this._maxRequested(docId, actorId, last)
    log("_loadBlocksWithDependencies", docId, actorId, first, last)

    // Stop requesting if done.
    if (first >= last) {
      return Promise.resolve()
    }

    return this._getBlockRange(actorId, first, last)
      .then(blocks => this._applyBlocks(docId, blocks))
      .then(() => this._loadMissingDependencyBlocks(docId))
  }

  // Loads and applies all blocks depended on by changes currently applied to
  // the doc for the given `docId`, recursively.
  //
  // Returns a promise that resolves when this completes.
  //
  // NOTE: RACE!!
  _loadMissingDependencyBlocks(docId) {
    log("_loadMissingDependencyBlocks", docId)

    const doc = this.find(docId)
    const deps = Backend.getMissingDeps(doc)
    return Promise.all(
      Object.keys(deps).map(actorId => {
        const last = deps[actorId] + 1 // last is exclusive
        return this._loadBlocksWithDependencies(docId, actorId, last)
      }),
    )
  }

  // Returns a promise that resolves to an array of blocks corresponding to the
  // arguments, once all of those fetches are complete.
  _getBlockRange(actorId, first, last) {
    log("_getBlockRange.start", actorId, first, last)

    if (last < first) {
      throw new Error(`Unexpected last < first: ${last}, ${first}`)
    }
    return new Promise((resolve, reject) => {
      this._trackedFeed(actorId).getBatch(first, last, (err, blocks) => {
        if (err) {
          reject(err)
        } else {
          log("getBlockRange.resolve", actorId, first, last)
          resolve(blocks)
        }
      })
    })
  }

  // Applies the given `blocks` to the in-memory doc corresponding to the
  // given `docId`.
  _applyBlock(docId, block) {
    log("_applyBlock", docId)
    this._applyBlocks(docId, [block])
  }

  // Applies the given `blocks` to the in-memory doc corresponding to the
  // given `docId`.
  _applyBlocks(docId, blocks) {
    log("_applyBlocks", docId)
    this.applyChanges(docId, blocks.map(block => JSON.parse(block)), false)
  }

  _filterChanges(changes) {
    return changes.filter(
      change =>
        !(
          this.appliedSeqs[change.actor] &&
          this.appliedSeqs[change.actor][change.seq]
        ),
    )
  }

  // Applies the given `changes` to the in-memory doc corresponding to the
  // given `docId`.
  applyChanges(docId, changes, local) {
    log("applyChanges", docId)

    if (changes.length === 0) return

    const oldDoc = this.find(docId)

    const filteredChanges = this._filterChanges(changes)

    const [newDoc, patches] = Backend.applyChanges(
      oldDoc,
      filteredChanges,
      true,
    )

    this._recordChanges(docId, newDoc, filteredChanges, local)

    this._setAndNotify(docId, newDoc, patches)
  }

  _recordChanges(docId, newDoc, changes, local) {
    for (let change of changes) {
      this.appliedSeqs[change.actor] = Object.assign(
        this.appliedSeqs[change.actor] || {},
        { [change.seq]: true },
      )
    }

    if (local) {
      const actorId = newDoc.get("actorId")
      const localChanges = changes.filter(change => change.actor === actorId)

      this._addToMaxRequested(docId, actorId, localChanges.length)
      this._appendAll(actorId, localChanges)
    }
  }

  // Tracks which blocks have been requested for a given doc,
  // so we know not to request them again.
  _maxRequested(docId, actorId, max) {
    if (!this.requestedBlocks[docId]) {
      this.requestedBlocks[docId] = {}
    }

    const current = this.requestedBlocks[docId][actorId] || START_BLOCK
    this.requestedBlocks[docId][actorId] = Math.max(max, current)
    return current
  }

  _addToMaxRequested(docId, actorId, x) {
    if (!this.requestedBlocks[docId]) {
      this.requestedBlocks[docId] = {}
    }
    this.requestedBlocks[docId][actorId] =
      (this.requestedBlocks[docId][actorId] || START_BLOCK) + x
  }

  // Updates our register of Automerge docs, setting `docId` to point to the
  // given `doc`. Will not emit `document:updated`, so should only be used
  // when registering our own updates or by a caller that will themself emit
  // the event.
  _set(docId, doc) {
    log("set", docId)
    this.docs[docId] = doc
  }

  // Updates our register of Automerge docs, setting `docId` to point to the
  // given `doc`. Will emit `document:updated` (if the doc is ready), so
  // appropriate for updates to the doc due to remote sources.
  _setAndNotify(docId, doc, patches) {
    log("_setAndNotify", docId)

    this._set(docId, doc)
    if (this.readyIndex[docId]) {
      this.emit("document:updated", docId, doc)
      this._handles(docId).forEach(handle => {
        handle._update(doc, patches)
      })
    }
  }

  _shareDoc(doc) {
    const { groupId } = this.metadata(this._getActorId(doc))
    const keys = this.groupIndex[groupId]
    this.message(groupId, { type: "FEEDS_SHARED", keys })
  }

  _relatedKeys(actorId) {
    const { groupId } = this.metadata(actorId)
    return this.groupIndex[groupId]
  }

  _messagePeer(peer, msg) {
    const data = Buffer.from(JSON.stringify(msg))
    peer.stream.extension("hypermerge", data)
  }

  _onMulticoreReady() {
    log("_onMulticoreReady")
  }

  _onDownload(docId, actorId) {
    return (index, data) => {
      log("_onDownload", docId, actorId, index)
      this._applyBlock(docId, data)
      this._loadMissingDependencyBlocks(docId)
    }
  }

  _onPeerAdded(actorId) {
    return peer => {
      peer.stream.on("extension", this._onExtension(actorId, peer))

      this._loadMetadata(actorId).then(() => {
        if (!this._isDocId(actorId)) {
          return
        }

        const keys = this._relatedKeys(actorId)
        this._messagePeer(peer, { type: "FEEDS_SHARED", keys })

        /**
         * Emitted when a network peer has connected.
         *
         * @event peer:left
         *
         * @param {string} actorId - the actorId of the connected peer
         * @param {object} peer - information about the connected peer
         */
        this.emit("peer:joined", actorId, peer)
      })
    }
  }

  _onPeerRemoved(actorId) {
    return peer => {
      this._loadMetadata(actorId).then(() => {
        if (!this._isDocId(actorId)) {
          return
        }

        /**
         * Emitted when a network peer has disconnected.
         *
         * @event peer:left
         *
         * @param {string} actorId - the actorId of the disconnected peer
         * @param {object} peer - information about the disconnected peer
         */
        this.emit("peer:left", actorId, peer)
      })
    }
  }

  _onExtension(actorId, peer) {
    return (name, data) => {
      switch (name) {
        case "hypermerge":
          this._onMessage(actorId, peer, data)
          break
        default:
          this.emit("peer:extension", actorId, name, data, peer)
      }
    }
  }

  _onMessage(actorId, peer, data) {
    const msg = JSON.parse(data)

    switch (msg.type) {
      case "FEEDS_SHARED":
        msg.keys.forEach(actorId => {
          this._trackedFeed(actorId)
        })
        break
      default:
        this.emit("peer:message", actorId, peer, msg)
        this._handles(actorId).forEach(handle => {
          handle._message({ peer, msg })
        })
    }
  }
}

// just for now - kill this later
function cleanDocId(id) {
  if (id.length == 64) {
    return Base58.encode(Buffer.from(id, "hex"))
  }
  if (id.length >= 32 && id.length <= 44) {
    return id
  }
  throw new Error("Invalid StoreId: " + id)
}

export { initHypermerge, Hypermerge }
//module.exports = { Hypermerge, initHypermerge }
