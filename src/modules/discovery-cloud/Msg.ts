export interface Hello {
  type: "Hello"
  id: string
  channels: string[]
}

export interface Join {
  type: "Join"
  id: string
  channels: string[]
}

export interface Leave {
  type: "Leave"
  id: string
  channels: string[]
}

export interface Connect {
  type: "Connect"
  peerId: string
  peerChannels: string[]
}

export type ClientToServer = Hello | Join | Leave
export type ServerToClient = Connect
