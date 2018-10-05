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
  channel: string
}

export type ClientToServer = Join | Leave
export type ServerToClient = Connect
