import { Change, Patch } from "automerge/backend"

export interface Ready {
  type: "Ready"
}

export interface WorkspaceSet {
  type: "WorkspaceSet"
  url: string
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
  changes: Change[]
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
  workspaceUrl: string | null
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

export interface ToggleDebug {
  type: "ToggleDebug"
}

export type FrontendToBackend =
  | Create
  | Open
  | WorkspaceSet
  | ChangeRequest
  | ActorIdRequest
  | RequestActivity
  | SetIdentity
  | ToggleDebug

export type BackendToFrontend =
  | Ready
  | DocReady
  | SetActorId
  | ApplyPatch
  | Clipper
  | Control
  | Presence
  | UploadActivity
  | DownloadActivity
