export interface Card {
  id: string
  x: number
  y: number
  z: number
  isBeingDraggedFromArchive: boolean
  onBoard: boolean
  text?: string
  image?: string
}

export const cardStyle: React.CSSProperties = {
  height: 90,
  width: 150,
  padding: 12,
  fontSize: 11,
  lineHeight: 1.4,
  position: "absolute",
  backgroundColor: "white",
  border: "1px solid #f0f0f0",
  borderRadius: 6,
  boxShadow: "0px 6px 12px -8px rgba(0,0,0,0.1)",
}

export const cardImageStyle: React.CSSProperties = {
  height: "90%",
  pointerEvents: "none",
}
