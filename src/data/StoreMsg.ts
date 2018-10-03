export interface Create {
  type: "Create"
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

export interface Patch {
  type: "Patch"
  docId: string
  actorId: string
  patch: unknown
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

export type FrontendToBackend = Create | Open | RequestActivity | SetIdentity

export type BackendToFrontend =
  | Patch
  | Presence
  | UploadActivity
  | DownloadActivity
