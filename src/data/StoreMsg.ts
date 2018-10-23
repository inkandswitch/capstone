import { Change, Patch } from "automerge/backend"

export interface Ready {
  type: "Ready"
}

export interface Create {
  type: "Create"
  docId: string
  keys: {
    publicKey: string
    secretKey: string
  }
}

export interface Open {
  type: "Open"
  docId: string
}

export interface RequestActivity {
  type: "RequestActivity"
  docId: string
}

export interface SetIdentity {
  type: "SetIdentity"
  identityUrl: string
}

export interface ChangeRequest {
  type: "ChangeRequest"
  docId: string
  change: Change
}

export interface ActorIdRequest {
  type: "ActorIdRequest"
  docId: string
}

export interface ApplyPatch {
  type: "ApplyPatch"
  docId: string
  patch: Patch
}

export interface DocReady {
  type: "DocReady"
  docId: string
  actorId?: string
  patch?: Patch
}

export interface DocInfo {
  type: "DocInfo"
  docId: string
  peers: number
  feeds: number
}

export interface SetActorId {
  type: "SetActorId"
  docId: string
  actorId: string
}

export interface Clipper {
  type: "Clipper"
  contentType: string
  content: string
}

export interface Control {
  type: "Control"
  url: string | null
}

export interface Presence {
  type: "Presence"
  errs: string[]
  docs: {
    [docId: string]: {
      connections: number
      peers: string[]
    }
  }
  peers: {
    [docId: string]: {
      devices: string[]
      docs: string[]
      lastSeen: number
    }
  }
}

export interface UploadActivity {
  type: "Upload"
  actorId: string
  seq: number
}

export interface DownloadActivity {
  type: "Download"
  actorId: string
  seq: number
}

export type EntryToMain = Clipper | Ready

export type BackgroundToEntry = Clipper

export type ToEntry = BackgroundToEntry

export type FrontendToBackend =
  | Create
  | Open
  | ChangeRequest
  | ActorIdRequest
  | RequestActivity
  | SetIdentity

export type BackendToFrontend =
  | DocReady
  | DocInfo
  | SetActorId
  | ApplyPatch
  | Clipper
  | Presence
  | UploadActivity
  | DownloadActivity
