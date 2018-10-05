export interface Join {
  type: "Join"
  channel: string
}

export interface Leave {
  type: "Leave"
  channel: string
}

export interface Connect {
  type: "Connect"
  peerId: string
  peerChannels: string[]
}

export type ClientToServer = Join | Leave
export type ServerToClient = Connect
